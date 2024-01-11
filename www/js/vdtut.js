/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: ВНЕУРОЧНАЯ ДЕЯТЕЛЬНОСТЬ (ИНТЕРФЕЙС КЛ. РУК.)
 *   Copyright © 2021, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Объект со списком всех групп внеур. деятельности с указанием педагогов
// vtGroups = {"23Б": ["Жуковедение", "Пупкин В. И."], ...}
// (загружается в конце скрипта)
let vtGroups = {};

// Собственно показ данных одного ученика
// В аргументе приходит что-то вроде "pupkin^Пупкин Василий"
const vtShow = async pupil => {
   dqs("#vtData").innerHTML = "<img src='static/preloader.gif'>";   
   
   // Получаем данные ученика с помощью API в объект
   // vtObj = {"23Б": {d628: "нн5", d831b: "4", ...} ...}
   let apiResp = await apireq("electGet", [pupil.split('^')[0]]);
   if (apiResp == "none") {
      dqs("#vtData").innerHTML = "<p>Не удалось получить данные</p>";
      return;
   }   
   let vtObj = JSON.parse(apiResp);
   
   // Публикуем
   if (!Object.keys(vtObj).length) {
      dqs("#vtData").innerHTML =
         "<h3>Этим учащимся курсы внеурочной деятельности не изучаются</h3>";
      return;
   }

   let vtData = "<table>";

   for (let gr of Object.keys(vtObj)) {
      
      let group = vtGroups[gr][0],
          ped = "<nobr>" + vtGroups[gr][1] + "</nobr>",
          gradesObj = vtObj[gr],
          grades = '';

      if (!Object.keys(gradesObj).length) grades = "Отметок нет";
      else for (let dt of Object.keys(gradesObj)) {
         let grd = gradesObj[dt].replace(/999/g, "зач");
         if (dt.length > 4 && grd == "0") grd = "н/а";
         dt = dt.length > 4 ?
              `<b>${DTSIT[dt][0]}</b>` :
              `<em>${dateConv(dt)}</em>`;
         grades += `<span>${dt}: ${grd}</span>`;
      }
      
      vtData += `<tr><td>${group}</td><td>${ped}</td><td>${grades}</td></tr>`;
   }

   dqs("#vtData").innerHTML = vtData + "</table>";
}

// Формирование списка детей в селекте выбора учащегося
const vtPupListShow = async () => {
   dqs("#vtData").innerHTML = '';
   let clName = dqs("#vtSelClass").value;
   let apiResp = await apireq("pupilsList", [clName]);
   if (apiResp != "none") {
      let vtClList = JSON.parse(apiResp);
      let selPupilInner = `<option value=''>== Выберите учащегося ==</option>`;
      for (let pup of vtClList) {
         let imya = pup[0].split(' ')[1] || 'N';
         let famI = pup[0].split(' ')[0] + ` ${imya[0]}.`;
         selPupilInner +=
            `<option value="${pup[1]}^${pup[0]}">${famI}</option>`;
      }
      dqs("#vtSelPupil").innerHTML = selPupilInner;
   }
   else {
      dqs("#vtSelPupil").innerHTML = '';
      dqs("#vtData").innerHTML = "<h3>В этом классе нет учащихся</h3>";
   }
}

// Формирование контента страницы
createSection("vdtut", `
   <select id="vtSelClass" onChange="vtPupListShow()"></select>
   <select id="vtSelPupil" onChange="vtShow(this.value)"></select>
   <div id="vtData" style="margin-top:20px"></div>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.vdtut = async () => {

   // Получаем список всех учителей {"pupkin": "Пупкин В. И.", ...}
   let apiResp   = await apireq("teachList");
   let teachList = {};
   for (let t of JSON.parse(apiResp)) teachList[t.login] = t.fio;
   
   // Получаем объект со списком всех групп внеур. деятельности и педагогов
   // vtGroups = {"23Б": ["Жуковедение", "Пупкин В. И."], ...}
   apiResp = await apireq("interGroupList");
   for (let gr of JSON.parse(apiResp))
      vtGroups[gr[0]] = [gr[1], teachList[gr[2]]];
   
   let selClassInner = '';   
   for (let cl of uTutorCls) selClassInner += `<option>${cl}</option>`;
   dqs("#vtSelClass").innerHTML = selClassInner;
   vtPupListShow(); // показываем список детей

   dqs("#vtData").innerHTML = '';
};
