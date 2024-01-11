/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: УЧЕТ ДОКУМЕНТОВ О ПРОПУСКАХ УРОКОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Добавление нового документа (запрос к API)
const sprAdd = async () => {
   let vid   = dqs("#sprVid").value,
       start = dqs("#sprStart").value,
       fin    = dqs("#sprFin").value,
       prim  = dqs("#sprPrim").value,
       pupil = dqs("#sprSelPupil").value;
       
   if (start > fin) {info(1, "Неверные даты!"); return;}

   let apiResp = await apireq("sprAdd", [vid, start, fin, prim, pupil]);
   if (apiResp != "none") sprDocsShow(pupil);
   else info(1, "Ошибка на сервере,<br>документ не добавлен");
}

// Удаление документа по его id
const sprDel = async (id) => {
   if (!confirm("Вы уверены?")) return;
   let apiResp = await apireq("sprDel", [id]);
   if (apiResp != "none") sprDocsShow(dqs("#sprSelPupil").value);
   else info(1, "Ошибка на сервере,<br>документ не удален");
}

// Формирование содержимого таблицы с документами одного учащегося
// (API возвращает массив объектов справок одного учащегося)
const sprDocsShow = async (pupil) => {
   // Преобразование даты вида 2019-09-13 к формату 13.09
   const dConv = d => `${d.substr(8,2)}.${d.substr(5,2)}`;
   
   let innerTable = "<tr><th> </th><th>Вид документа</th>"
                  + "<th>Даты</th><th>Прим.</th></tr>";
   let apiResp = await apireq("sprGet", [pupil]);
   if (apiResp != "none") {
      let sprList = JSON.parse(apiResp);      
      if (!sprList.length)
         innerTable += "<tr><td colspan=4>Документов не найдено</td></tr>";      
      else {
         let i = 0;
         for (let spr of sprList) {
            i++;
            let start = dConv(spr.start), fin = dConv(spr.fin);
            let dt = (start == fin) ? start : `${start} – ${fin}`;
            let firstTD = `<td title="Удалить документ" `
                       + `onClick=sprDel("${spr._id}")>&#10060;</td>`;
            if (
                  dqs("#selRole").value == "pupil" ||
                  dqs("#selRole").value == "parent"
               ) firstTD = `<td>${i}</td>`;
            
            innerTable += `<tr>${firstTD}<td>${sprVid[spr.vid]}</td>`
                        + `<td>${dt}</td><td>${spr.prim}</td></tr>`;
         }
      }
      dqs("#sprShowDel").innerHTML = innerTable;
   }
   else info(1, "Не могу загрузить<br>список документов");
};

// Формирование списка детей в селекте выбора учащегося
const sprPupListShow = async () => {
   let clName = dqs("#sprSelClass").value;
   let apiResp = await apireq("pupilsList", [clName]);
   if (apiResp != "none") {
      let pupilsList = JSON.parse(apiResp);
      let selPupilInner = '';
      for (let pup of pupilsList)
         selPupilInner += `<option value="${pup[1]}">${pup[0]}</option>`;
      dqs("#sprSelPupil").innerHTML = selPupilInner;
      sprDocsShow(pupilsList[0][1]); // показываем справки первого учащегося
   }   
   else info(1, "Не могу загрузить список учащихся");
}

// Формирование контента страницы (regNow, regYst, regYfin определены в ini.js)
createSection("docs", `
   <select id="sprSelClass" onChange="sprPupListShow()"></select>
   <select id="sprSelPupil" onChange="sprDocsShow(this.value)"></select>
   <div id="sprAdd">
      <h3>Добавить новый документ</h3>
      <select id="sprVid"></select>
      <nobr>с <input id="sprStart" type="date"
         min="${regYst}" max="${regYfin}" value="${regNow}"></nobr>
      <nobr>по <input id="sprFin" type="date"
         min="${regYst}" max="${regYfin}" value="${regNow}"></nobr>
      <input id="sprPrim" type="text" placeholder="Примечание">
      <button id="sprSubm" type="button" onClick="sprAdd()"> >> </button>
      <h3>Зарегистрированные документы</h3>
   </div>
   <table id="sprShowDel"></table>
`);

// Формируем селект выбора вида документа (sprVid определен в ini.js)
let sprVidInner = '';
for (let kod of Object.keys(sprVid))
   sprVidInner += `<option value="${kod}">${sprVid[kod]}</option>`;
dqs("#sprVid").innerHTML = sprVidInner; 

// Динамически формируем содержимое страницы (имя метода = имени пункта меню!)
getContent.docs = async () => {
   
   let sprRole = dqs("#selRole").value;   
   
   // Если он учащийся или родитель, показываем ему только его справки
   if (sprRole == "pupil" || sprRole == "parent") {
      dqs("#sprSelClass").style.display = "none";
      dqs("#sprSelPupil").style.display = "none";
      dqs("#sprAdd")     .style.display = "none";
      sprDocsShow("pupil"); // реальный логин подпишется на бэкенде 
   }
   
   // Если он классный руководитель, показываем ему его классы
   else if (sprRole == "tutor") {
      let selClassInner = '';
      for (let cl of uTutorCls) selClassInner += `<option>${cl}</option>`;
      dqs("#sprSelClass").innerHTML = selClassInner;
      sprPupListShow(); // показываем список детей
   }
}