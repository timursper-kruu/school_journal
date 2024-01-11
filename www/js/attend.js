/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: СТАТИСТИКА ЯВКИ ЗА ОДИН ДЕНЬ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Справочник предметов
let attSbList = {};

// Получение статистики явки за один день с сервера
// (в запросе передается только дата в формате d123)
// Сервер возвращает несортированный объект вида
// {"10Б": {"Иванов Василий": ["s430", "s210"], ...}}
const attendGet = async () => {
   let dt = dateConv(dqs("#attDt").value);
   let apiResp = await apireq("attendGet", [dt]);
   if (apiResp == "none") {
      dqs("#attResult").innerHTML = "<p>Не удалось получить данные</p>";
      return;
   }
   let drRusArr = dqs("#attDt").value.split('-'),
       dtRus    = `${drRusArr[2]}.${drRusArr[1]}`;
   dqs("#attResult").innerHTML =
      `<h3>Учащиеся, пропустившие уроки ${dtRus}</h3>`;
   let attObj = JSON.parse(apiResp);
   if (!Object.keys(attObj).length) {
      dqs("#attResult").innerHTML += "<p>Учащиеся не найдены</p>";
      return;
   }
   let inner = "<table>";
   let clSort = Object.keys(attObj)
              . sort((x,y) => x.padStart(3,'0') > y.padStart(3,'0'));
   for (let cl of clSort) {
      let pups = Object.keys(attObj[cl]).sort((x,y) => x.localeCompare(y,"ru"));
      for (let pup of pups) {
         let sb = attObj[cl][pup].map(x => attSbList[x]).join("<br>");
         inner += `<tr><td>${cl}</td><td>${pup}</td><td>${sb}</td></tr>`;
      }
   }
   inner += "</table>";
   dqs("#attResult").innerHTML += inner;  
}

// Формирование контента страницы
createSection("attend", `
   <input id="attDt" type="date"
      min="${regYst}" max="${regYfin}" value="${regNow}">
   <button type="button" onclick="attendGet()">Обновить данные</button>
   <div id="attResult"><img src='static/preloader.gif'></div>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.attend = async () => {

   // Загружаем справочник предметов   
   let apiResp     = await apireq("subjList");
   let subjListDop = JSON.parse(apiResp);
   attSbList   = {...subjDef, ...subjListDop};

   attendGet();
}
