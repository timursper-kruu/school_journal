/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: КОДЫ ДОСТУПА К ЖУРНАЛУ ДЛЯ РОДИТЕЛЕЙ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Получение родительских кодов с сервера и публикация их на странице
// При наличии аргумента - отдается файл с версией для печати
const getParCodes = async () => {
   let clName = dqs("#parcClassSel").value;
   let apiResp = await apireq("parCodes", [clName]);
   if (apiResp == "none") {info(1, "Ошибка на сервере"); return;}
   let codes = JSON.parse(apiResp);
   
   // Публикуем таблицу с кодами на странице и готовим данные для печати
   let cont =
      "<table><tr><th>Фамилия, имя</th><th>Логин</th><th>Код</th></tr>";
   let print = '';
   
   for (let s of codes) {
      cont  += `<tr><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td></tr>`;
      print += `${s[0]}. Логин: ${s[1]} Код: ${s[2]}\r\n\r\n---------\r\n\r\n`;
   }
   
   cont += "</table>";
   dqs("#parcTable").innerHTML = cont;
   
   // Подготавливаем ссылку на версию для печати   
   let dataLink = new Blob([print], {type: "text/plain"});
   dqs("#parcPrint").href = window.URL.createObjectURL(dataLink);
   dqs("#parcPrint").download = "parcodes.txt";
}

createSection("parcodes", `
   <h3>Коды доступа к журналу для родителей</h3>
   <select id="parcClassSel" onChange="getParCodes()"></select>
   <div id="parcTable"></div>
   <a id="parcPrint">Версия для печати</a>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.parcodes = async () => {
   
   // Формирование списка классов в селекте (uTutorCls определен в login.js)   
   let parcSelClInner = '';
   for (let cls of uTutorCls) parcSelClInner += `<option>${cls}</option>`;
   dqs("#parcClassSel").innerHTML = parcSelClInner;
   
   // Получаем родительские коды для {первого класса в списке классов}
   getParCodes();
}
