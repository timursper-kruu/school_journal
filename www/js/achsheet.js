/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: ГЕНЕРИРОВАНИЕ ТАБЕЛЕЙ УСПЕВАЕМОСТИ
 *   Copyright © 2021, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Объект с предметами (подгружается в конце страницы)
let achSbList = {};

// Замена отметок на расшифровку
const grFull = {
   "0":"н/а", "2":"2 (неуд.)", "3":"3 (удовл.)",
   "4":"4 (хор.)", "5":"5 (отл.)", "999":"зач."
};

// Собственно генерирование табеля одного ученика
// В аргументе приходит что-то вроде "pupkin^Пупкин Василий, 8Б класс"
const achShow = async (pupil) => {
   dqs("#tabel").innerHTML = "<img src='static/preloader.gif'>";   
   
   // Получаем фамилию, имя и класс ученика для подзаголовка
   let famImCl = pupil.split('^')[1];
   let podzag  = famImCl ? `<p><b>${famImCl}</b></p>` : '';
   
   // Получаем итоговые отметки с помощью API в объект
   // gradesObj = {"s410": {d628a: "5", d831b: "0", ...} ...}
   info(0, "Пожалуйста, дождитесь<br>загрузки данных.");
   let apiResp = await apireq("tabelGet", [pupil.split('^')[0]]);
   info(2);
   if (apiResp == "none") {
      dqs("#tabel").innerHTML = "<p>Не удалось получить данные</p>";
      return;
   }   
   let gradesObj = JSON.parse(apiResp);
   
   // Упорядоченный список кодов предметов (ключи объекта gradesObj)
   let subjs = Object.keys(gradesObj).sort((a, b) => {
      if (a.length != b.length) return a.length < b.length ? 1 : -1;
      else if (a.length == 3)   return a > b ? 1 : -1;
      else return a.substr(1, 3) > b.substr(1, 3) ? 1 : -1;
   });
   
   // Публикуем
   if (!subjs.length) {
      dqs("#tabel").innerHTML =
         "<p>Табель не сгенерирован:<br>не выставлено ни одной " +
         "отметки промежуточной аттестации</p>";
      return;
   }
   let tabel = "<h3>ТАБЕЛЬ ОТМЕТОК ПРОМЕЖУТОЧНОЙ АТТЕСТАЦИИ</h3>" + podzag;
   
   tabel += "<table><tr><th>Предмет</th>";
   for (let period of Object.keys(DTSIT))
      tabel += `<th>${DTSIT[period][0]}</th>`;
   tabel += "</tr>";
   
   for (let sbCode of subjs) {
      tabel += `<tr><td>${achSbList[sbCode]}</td>`;
      for (let period of Object.keys(DTSIT)) {
         let grade = gradesObj[sbCode][period] ?
                     gradesObj[sbCode][period] : "–";
         grade = grFull[grade] ? grFull[grade] : grade;
         tabel += `<td>${grade}</td>`;
      }
      tabel += "</tr>";
   }
   
   tabel += "</table>";   
   
   dqs("#tabel").innerHTML =
      tabel + "<p><a id='achPrint'>Версия для печати</a></p>";
   
   // Подготавливаем версию для печати (HTML определен в ini.js)
   let tabelPrn = tabel + "<p class='sgn'>Директор<br>Классный руководитель</p>";
   let printCont = HTML.replace("{{body}}", tabelPrn).replace("8pt", "9pt")
                 . replace("<h3>", "<h3 style='margin-top:5cm'>");
   let dataLink = new Blob([printCont], {type: "text/html"});
   dqs("#achPrint").href = window.URL.createObjectURL(dataLink);
   dqs("#achPrint").download = "tabel.html";
}

// Формирование списка детей в селекте выбора учащегося
const achPupListShow = async () => {
   dqs("#tabel").innerHTML = '';
   let clName = dqs("#achSelClass").value;
   let apiResp = await apireq("pupilsList", [clName]);
   if (apiResp != "none") {
      let achClList = JSON.parse(apiResp);
      let selPupilInner = `<option value=''>== Выберите учащегося ==</option>`;
      for (let pup of achClList) {
         let imya = pup[0].split(' ')[1] || 'N';
         let famI = pup[0].split(' ')[0] + ` ${imya[0]}.`;
         selPupilInner += `<option value="${pup[1]}^${pup[0]}, `
                        + `${clName} класс">${famI}</option>`;
      }
      dqs("#achSelPupil").innerHTML = selPupilInner;
   }
   else {
      dqs("#achSelPupil").innerHTML = '';
      dqs("#tabel").innerHTML = "<h3>В этом классе нет учащихся</h3>";
   }
   genButtonTabelAll(); // Показываем кнопку генер. табеля всего класса
}

// Подстановка кнопки для генерирования табеля класса в соотв. div
const genButtonTabelAll = () => {
   dqs("#tabelAllClass").innerHTML =
      "<button type='button' onclick='tabGenAllClass()'>"
    + "Табель всего класса</button>";
}

// Преобразование текста utf-8 в кодировку win-1251 (возвращает Uint8Array)
const utf8to1251 = stroka => {
   const cp1251 = {
     '\n': '0A','\r': '0D', ' ': '20', '!': '21', '"': '22', '#': '23',
      '$': '24', '%': '25', '&': '26','\'': '27', '(': '28', ')': '29',
      '*': '2A', '+': '2B', ',': '2C', '-': '2D', '.': '2E', '/': '2F',
      '0': '30', '1': '31', '2': '32', '3': '33', '4': '34', '5': '35',
      '6': '36', '7': '37', '8': '38', '9': '39', ':': '3A', ';': '3B',
      '<': '3C', '=': '3D', '>': '3E', '?': '3F', '@': '40', 'A': '41',
      'B': '42', 'C': '43', 'D': '44', 'E': '45', 'F': '46', 'G': '47',
      'H': '48', 'I': '49', 'J': '4A', 'K': '4B', 'L': '4C', 'M': '4D',
      'N': '4E', 'O': '4F', 'P': '50', 'Q': '51', 'R': '52', 'S': '53',
      'T': '54', 'U': '55', 'V': '56', 'W': '57', 'X': '58', 'Y': '59',
      'Z': '5A', '[': '5B','\\': '5C', ']': '5D', '^': '5E', '_': '5F',
      '`': '60', 'a': '61', 'b': '62', 'c': '63', 'd': '64', 'e': '65',
      'f': '66', 'g': '67', 'h': '68', 'i': '69', 'j': '6A', 'k': '6B',
      'l': '6C', 'm': '6D', 'n': '6E', 'o': '6F', 'p': '70', 'q': '71',
      'r': '72', 's': '73', 't': '74', 'u': '75', 'v': '76', 'w': '77',
      'x': '78', 'y': '79', 'z': '7A', '{': '7B', '|': '7C', '}': '7D',
      '~': '7E', '–': '96', '—': '97', 'Ё': 'A8', '«': 'AB', 'ё': 'B8',
      '№': 'B9', '»': 'BB', 'А': 'C0', 'Б': 'C1', 'В': 'C2', 'Г': 'C3',
      'Д': 'C4', 'Е': 'C5', 'Ж': 'C6', 'З': 'C7', 'И': 'C8', 'Й': 'C9',
      'К': 'CA', 'Л': 'CB', 'М': 'CC', 'Н': 'CD', 'О': 'CE', 'П': 'CF',
      'Р': 'D0', 'С': 'D1', 'Т': 'D2', 'У': 'D3', 'Ф': 'D4', 'Х': 'D5',
      'Ц': 'D6', 'Ч': 'D7', 'Ш': 'D8', 'Щ': 'D9', 'Ъ': 'DA', 'Ы': 'DB',
      'Ь': 'DC', 'Э': 'DD', 'Ю': 'DE', 'Я': 'DF', 'а': 'E0', 'б': 'E1',
      'в': 'E2', 'г': 'E3', 'д': 'E4', 'е': 'E5', 'ж': 'E6', 'з': 'E7',
      'и': 'E8', 'й': 'E9', 'к': 'EA', 'л': 'EB', 'м': 'EC', 'н': 'ED',
      'о': 'EE', 'п': 'EF', 'р': 'F0', 'с': 'F1', 'т': 'F2', 'у': 'F3',
      'ф': 'F4', 'х': 'F5', 'ц': 'F6', 'ч': 'F7', 'ш': 'F8', 'щ': 'F9',
      'ъ': 'FA', 'ы': 'FB', 'ь': 'FC', 'э': 'FD', 'ю': 'FE', 'я': 'FF'
   };
   return new Uint8Array(
      stroka.split('').map(x => parseInt(cp1251[x] || '3F', 16))
   );
}

// Запрос и формирование ссылки на скачивание табеля всего класса
// (отдается в кодировке windows-1251)
const tabGenAllClass = async () => {
   dqs("#tabelAllClass").innerHTML = "<p>Табель генерируется, ждите...</p>";
   let clName = dqs("#achSelClass").value;
   let apiResp = await apireq("tabelGenAll", [clName]);
   if (apiResp != "none") {
      let dataLink = new Blob([utf8to1251(apiResp)], {type: "text/csv"}),
                hr = window.URL.createObjectURL(dataLink);
      dqs("#tabelAllClass").innerHTML = 
         `<a href="${hr}" download='tabel${clName}.csv'>`
       + `Скачать табель всего ${clName}</a>`;
   }
   else {
      dqs("#tabelAllClass").innerHTML = "<p>Не удалось получить табель</p>";
      return;
   }
}

// Формирование контента страницы
createSection("achsheet", `
   <select id="achSelClass" onChange="achPupListShow()"></select>
   <select id="achSelPupil" onChange="achShow(this.value)"></select>
   <div id="tabel" style="margin-top:20px"></div>
   <div id="tabelAllClass" style="margin-top:20px"></div>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.achsheet = async () => {
   
   // Получаем глобальный объект со списком всех предметов
   // achSbList = {"s110": "Русский язык", ...}
   let apiResp     = await apireq("subjList");
   let achListDop = JSON.parse(apiResp);
   achSbList  = {...subjDef, ...achListDop};
   
   let achRole = dqs("#selRole").value;
   let selClassInner = '';
   
   // Если он учащийся или родитель, показываем ему его табель
   if (achRole == "pupil" || achRole == "parent") {
      dqs("#achSelClass").style.display = "none";
      dqs("#achSelPupil").style.display = "none";
      achShow(`${uLogin}^`);
   }
   // Если он администратор, показываем ему все классы
   else if (achRole == "admin") {
      let apiResp = await apireq("classesList");
      if (apiResp == "none") {info(1, "Не могу получить данные"); return;}
      let achAllClasses = classSort(JSON.parse(apiResp));
      for (let cl of achAllClasses) selClassInner += `<option>${cl}</option>`;
      dqs("#achSelClass").innerHTML = selClassInner;
      achPupListShow();    // показываем список детей
      genButtonTabelAll(); // Показываем кнопку генер. табеля всего класса
   }
   // Если он классный руководитель, показываем ему его классы
   else if (achRole == "tutor") {
      for (let cl of uTutorCls) selClassInner += `<option>${cl}</option>`;
      dqs("#achSelClass").innerHTML = selClassInner;
      achPupListShow();    // показываем список детей
      genButtonTabelAll(); // Показываем кнопку генер. табеля всего класса
   }
   dqs("#tabel").innerHTML = '';
};