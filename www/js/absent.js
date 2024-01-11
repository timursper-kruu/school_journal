/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: БЛОК УЧЕТА ПОСЕЩАЕМОСТИ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Текущий список класса
let absClList = [];

// Справочник предметов
let absSbList = {};

// Функция получает данные о посещаемости и об уважительных причинах пропусков
// уроков, все это обсчитывает и публикует на странице. Аргумент - либо логин
// ученика, либо наименование класса типа 11Б
const absShow = async (clORpup) => {
   
   dqs("#absResult").innerHTML = "<img src='static/preloader.gif'>";
   
   let reqObj = [], onePupil = false;
   if (/[А-Я]/.test(clORpup)) reqObj = [clORpup, ''];   // запрошен весь класс
   else     {onePupil = true; reqObj = ['', clORpup];}  // запрошен один ученик
   
   // Получаем исходный массив absentArr объектов с данными о посещаемости
   // (учитель Сидоров, учащийся Иванов)
   // [{d: "d730", s: s430, p: ivanov, abs: 2}, ...]   
   let apiResp = await apireq("absentGet", reqObj);
   if (apiResp == "none") {info(1, "Не могу получить данные"); return;}
   let absentArr = JSON.parse(apiResp);
   
   // Получаем объект respectObj с данными об уважительных причинах пропусков:
   // {
   //    ivanov: [["d002", "d013"], ...],
   //    petrov: ...
   // }
   apiResp = await apireq("sprResp", reqObj);
   if (apiResp == "none") {info(1, "Не могу получить данные"); return;}
   let respectObjApi = JSON.parse(apiResp);
   // Переформатируем из формата 2019-09-02, полученного от API, в формат d002
   let respectObj = {};
   for (let pup of Object.keys(respectObjApi)) {
      respectObj[pup] = [];
      for (let para of respectObjApi[pup]) {
         para[0] = dateConv(para[0]);
         para[1] = dateConv(para[1]);
         respectObj[pup].push([para[0], para[1]]);
      }
   }
   
   // Подсчет числа пропусков (общего и по уважительной) всех учеников
   // по учебным периодам; результат в объекте absVal:
   // {
   //    ivanov: {d628a: [34, 28], ...},
   //    petrov: {d628a: [56, 13], ...},
   //    ...
   // }
   // Итоговый результат по всему классу - в объекте absItog:
   // {d628a: [156, 122], ...}
   let absVal = {}, pattern = {}; // шаблон объекта одного ученика
   for (let itName of Object.keys(DTSIT)) {
      pattern[itName] = [0, 0];
   }
   let pattStr = JSON.stringify(pattern);
   let absItog = JSON.parse(pattStr);
      
   for (let propusk of absentArr) {
      
      // Сначала считаем все пропуски
      if (!absVal[propusk.p]) absVal[propusk.p] = JSON.parse(pattStr);
      for (let itName of Object.keys(DTSIT)) {
         if (propusk.d >= DTSIT[itName][2] && propusk.d <= DTSIT[itName][3]) {
            absVal[propusk.p][itName][0] += propusk.abs; // все пропуски
            absItog[itName][0] += propusk.abs;
         }
      }
      
      // Теперь считаем уважительные, цикл по объекту respectObj
      // чтобы понять, уважительный наш текущий пропуск или нет
      let absIsResp = false;
      if (!respectObj[propusk.p]) continue; // если у него нет справок вообще
      for (let dats of respectObj[propusk.p])
         if (propusk.d >= dats[0] && propusk.d <= dats[1]) absIsResp = true;
      // Если пропуск был уважительный, пишем его в нужные периоды уч. года
      if (absIsResp) for (let itName of Object.keys(DTSIT)) {
         if (propusk.d >= DTSIT[itName][2] && propusk.d <= DTSIT[itName][3]) {
            absVal[propusk.p][itName][1] += propusk.abs;
            absItog[itName][1] += propusk.abs;
         }
      }
   } // конец подсчета общего числа пропусков всех учеников

   // Публикация данных о посещаемости
   let dann = '';   
   if (Object.keys(absVal).length) {      
      
      // Сначала публикуем таблицу со сводными данными
      dann = "<h3>Сводные данные посещаемости</h3>";
      dann += "<table><tr><th rowspan=2> </th>";
      let str1 = '', str2 = '';
      for (let itName of Object.keys(DTSIT)) {
         str1 += `<th colspan=2>${DTSIT[itName][0]}</th>`;
         str2 += "<th>всего</th><th>по ув.</th>";
      }
      dann  += `${str1}</tr><tr>${str2}</tr>`;
      
      let list4table = [...absClList];
      if (onePupil) {
         let famil = "Пропущено уроков";
         for (let pupil of absClList) // ищем фамилию, если получен absClList
            if (pupil[1] == clORpup) {famil = pupil[0]; break;}
         list4table = [[famil, clORpup]];
      }
      for (let pupil of list4table) {
         dann += `<tr><td>${pupil[0]}</td>`;
         for (let itName of Object.keys(DTSIT)) {
            if (absVal[pupil[1]])
               dann += `<td>${absVal[pupil[1]][itName][0]}</td>`
                    + `<td>${absVal[pupil[1]][itName][1]}</td>`;
            else dann += "<td>0</td><td>0</td>";
         }
         dann += "</tr>";
      }
      // Если запрошен весь класс, подписываем еще итоговую строку
      if (!onePupil) {
         dann += `<tr class="bold"><td>Итого</td>`;
         for (let itName of Object.keys(DTSIT)) {
            dann += `<td>${absItog[itName][0]}</td>`
                  + `<td>${absItog[itName][1]}</td>`;
         }
         dann += "</tr>";
      }
      dann += "</table>";      
      
      // Если запрашивался один ребенок, еще публикуем расшифровку его прогулов
      if (onePupil) {
         dann += "<h3>Пропуски уроков без уважительной причины</h3>";
         
         // Загружаем справочник предметов, если он не загружен ранее
         if (!Object.keys(absSbList).length) {
            let apiResp     = await apireq("subjList");
            let subjListDop = JSON.parse(apiResp);
            absSbList   = {...subjDef, ...subjListDop};
         }
         
         // Результат - в объекте absNoResp с ключами - кодами предметов
         // {s110: ["d730(1)", "d023(2)"], ...}
         // Идем циклом по всем пропускам
         let absNoResp = {};
         for (let propusk of absentArr) {
            // Цикл по объекту respectObj (уважительный ли текущий пропуск)
            let noResp = true;
            if (respectObj[clORpup]) for (let dats of respectObj[clORpup])
               if (propusk.d >= dats[0] && propusk.d <= dats[1]) noResp = false;
            // Неуважительный пропуск пишем в объект absNoResp
            if (noResp) {
               if (!absNoResp[propusk.s]) absNoResp[propusk.s] = [];
               absNoResp[propusk.s].push(`${propusk.d}(${propusk.abs})`);
            }
         }
         // Публикуем расшифровку прогулов на страничке
         if (!Object.keys(absNoResp).length)
            dann += "<p>Пропусков уроков без уважительной причины нет</p>";
         else {
            dann += "<table id='noRespect'>";
            for (let subjCode of Object.keys(absNoResp)
                 .sort((a,b) => a.substr(1,3) > b.substr(1,3))) {
               dann += `<tr><td>${absSbList[subjCode]}</td><td>`;
               let tdInn = '';
               for (let dt of absNoResp[subjCode].sort())
                  tdInn += `${dateConv(dt.substr(0,4))}${dt.substr(4)}, `;
               tdInn = tdInn.trim().replace(/,$/, '');
               dann += tdInn + "</td></tr>";
            }
            dann += "</table>";
         }
      } // конец расшифровки прогулов одного ребенка
   }
   else dann = "<h3>Пропусков уроков нет</h3>";
   dqs("#absResult").innerHTML =
      dann + "<p><a id='absPrint'>Версия для печати</a></p>";
   
   // Подготавливаем версию для печати (HTML определен в ini.js)
   let printCont = HTML.replace("{{body}}", dann);
   let dataLink = new Blob([printCont], {type: "text/html"});
   dqs("#absPrint").href = window.URL.createObjectURL(dataLink);
   dqs("#absPrint").download = "absent.html";
   
} // конец функции подсчета и публикации данных о посещаемости

// Формирование списка детей в селекте выбора учащегося
const absPupListShow = async () => {
   let clName = dqs("#absSelClass").value;
   let apiResp = await apireq("pupilsList", [clName]);
   if (apiResp != "none") {
      absClList = JSON.parse(apiResp);
      let selPupilInner = `<option value="${clName}">ВЕСЬ КЛАСС</option>`;
      for (let pup of absClList) {
         let imya = pup[0].split(' ')[1] || 'N';
         pup[0] = pup[0].split(' ')[0] + ` ${imya[0]}.`;
         selPupilInner += `<option value="${pup[1]}">${pup[0]}</option>`;
      }
      dqs("#absSelPupil").innerHTML = selPupilInner;
      absShow(clName); // показываем пропуски всего класса
   }
   else {
      dqs("#absSelPupil").innerHTML = '';
      dqs("#absResult").innerHTML = "<h3>В этом классе нет учащихся</h3>";
   }
}

// Формирование контента страницы
createSection("absent", `
   <select id="absSelClass" onChange="absPupListShow()"></select>
   <select id="absSelPupil" onChange="absShow(this.value)"></select>
   <div id="absResult"><img src='static/preloader.gif'></div>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.absent = async () => {
   
   let absRole = dqs("#selRole").value;   
   
   // Если он учащийся или родитель, показываем ему только его пропуски
   if (absRole == "pupil" || absRole == "parent") {
      dqs("#absSelClass").style.display = "none";
      dqs("#absSelPupil").style.display = "none";
      absShow(uLogin);
   }  
   else {
      let selClassInner = '';
      
      // Если он классный руководитель, показываем ему его классы
      if (absRole == "tutor")
         for (let cl of uTutorCls) selClassInner += `<option>${cl}</option>`;
      
      // Если он администратор, показываем ему все классы
      else if (absRole == "admin") {
         let apiResp = await apireq("classesList");
         if (apiResp == "none") {info(1, "Не могу получить данные"); return;}
         let absAllClasses = classSort(JSON.parse(apiResp));
         for (let cl of absAllClasses)
            selClassInner += `<option>${cl}</option>`;
      }
      dqs("#absSelClass").innerHTML = selClassInner;
      absPupListShow(); // показываем список детей
   }
};
