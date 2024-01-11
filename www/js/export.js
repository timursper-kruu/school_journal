/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: ЭКСПОРТ ЭЛЕКТРОННОГО ЖУРНАЛА В ФАЙЛ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Объект со списком всех предметов
let expSbListFull = {};

// Учебные периоды типа ["1ч", "2ч", ...]
let PERDS = [];
for (let perN=0; perN<STPER.length; perN++) PERDS[perN] = STPER[perN][0];

// Функция получает файл журнала с бэкенда и отдает его юзеру
const getExpFile = async () => {   
   // Получаем файл со скриптом показа журнала   
   let scrContent = await (await fetch("/js/viewExport.js")).text();
   if (!scrContent.includes("use strict")) {
      info(1, "Не могу получить данные");
      return;
   }
   scrContent = scrContent.replace(/\r/g, '').replace(/\/\/.*?\n/g, '')
              . replace(/\/\*.*?\*\//g, '').replace(/ /g, '¤')
              . replace(/\s+/g, ' ').replace(/¤/g, ' ').trim();
   
   // Получаем собственно файл с данными журнала
   dqs("#expGet").innerHTML = "<img src='static/preloader.gif'>";
   dqs("#expGet").style.display = "inline";
   let className = dqs("#expSelClass").value;
   let fileContent = await apireq("export", [className]);
   if (fileContent == "none") {info(1, "Не могу получить данные"); return;}
   
   // Заменяем коды предметов и дат на названия и собственно даты
   let expObj = JSON.parse(fileContent);
   for (let i=0; i<expObj.content.length; i++) {
      // Код предмета заменяем на название      
      expObj.content[i].s = expSbListFull[expObj.content[i].s];
      
      // Заменяем код даты на собственно дату
      for (let j=0; j<expObj.content[i].l.length; j++) {
         let dtCode = (expObj.content[i].l)[j].d;
         let dt;
         if (dtCode.length == 4) dt = dateConv(dtCode);
         else {
            if (DTSIT[dtCode]) dt = `<b>${DTSIT[dtCode][0]}</b>`;
            else dt = `<b>${dateConv(dtCode.slice(0,4))}</b>`;
         }
         (expObj.content[i].l)[j].d = dt;
      }
   }
   
   fileContent = "<!DOCTYPE html><html lang='ru'><head>"
      + `<meta charset='utf-8'></head><body><article>${JSON.stringify(expObj)}`
      + `</article><script>"use strict"; const PERDS = ${JSON.stringify(PERDS)}`
      + `</script><script>${scrContent}</script></body></html>`;

   // Отдаем юзеру
   let dataLink = new Blob([fileContent], {type: "text/html"});
   let linkElem = dqs("#expGet");
   linkElem.href = window.URL.createObjectURL(dataLink);
   linkElem.download = `${className}.html`;
   linkElem.innerHTML = `Скачать файл ${className}.html`;
}

// Формирование контента страницы
createSection("export", `
   <h3>Экспорт журнала одного класса в файл</h3>
   <select id="expSelClass"></select>
   <button type="button" onClick="getExpFile()">Экспортировать</button>
   <p>&nbsp;<a id="expGet">Скачать файл</a></p>
   
   <h3 id="expMan">Инструкция</h3><ol>
   <li>Выберите класс из выпадающего списка и нажмите кнопку «Экс&shy;пор&shy;ти&shy;ро&shy;вать».</li>
   <li>После загрузки электронного журнала выбранного класса (это может занять
   некоторое время) появится ссылка «Скачать файл». Кликните по ней и выберите
   один из вариантов: «Открыть в...» или «Сохранить» (этот вариант
   предпочтительнее, так как позволит работать с экспортированным электронным
   журналом в последующем).</li>
   <li>Если вы выбрали вариант «Сохранить», для просмотра сохраненного журнала
   просто откройте соответствующий html-файл в браузере. Предпочтительнее
   использовать браузер, поддерживающий русские переносы, например, Mozilla
   Firefox. В случае выбора варианта «Открыть в...» экспортированный журнал
   откроется для просмотра сразу (в отдельной вкладке браузера).</li>
   <li>Для печати нажмите на значок принтера в правом верхнем углу окна
   просмотра экспортированного журнала. Вы можете как напечатать журнал на
   бумаге, так и сохранить его в виде pdf-файла (выберите необходимый способ в
   появившемся окне выбора принтера). В случае печати на бумаге печатать
   необходимо <b>на двух сторонах листа</b>.</li>
   <li>Следует иметь в виду, что если по какому-либо предмету не записано ни
   одной темы урока, этот предмет <b>не попадает в экспортируемый файл</b>,
   даже если по этому предмету выставлены отметки промежуточной аттестации.</li>
   <li>В случае, если в бумажный вариант журнала необходимо включить сводную
   ведомость посещаемости учащихся, следует сгенерировать и распечатать эту
   ведомость отдельно (вкладка «Посещаемость», пункт выпадающего списка «Весь
   класс»).</li>
   <li>Журналы учета внеурочной деятельности в межклассных группах экспортируются педагогами, проводящими занятия в этих группах, либо администратором при просмотре журнальных страниц этих групп (значок «Экспорт» справа от названия группы).</li></ol>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.export = async () => {
   
   let expRole = dqs("#selRole").value;   
   let selClassInner = '';
   dqs("#expGet").style.display = "none";
   
   // Если он классный руководитель, показываем ему его классы
   if (expRole == "tutor")
      for (let cl of uTutorCls) selClassInner += `<option>${cl}</option>`;
   
   // Если он администратор, показываем ему все классы
   else if (expRole == "admin") {
      let apiResp = await apireq("classesList");
      if (apiResp == "none") {info(1, "Не могу получить данные"); return;}
      let absAllClasses = classSort(JSON.parse(apiResp));
      for (let cl of absAllClasses) selClassInner += `<option>${cl}</option>`;
   }
   dqs("#expSelClass").innerHTML = selClassInner;
   
   // Заполняем объект со списком всех предметов
   expSbListFull = await sbListFullGet();
};