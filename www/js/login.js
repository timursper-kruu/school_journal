/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ И ЗАГРУЗКА СКРИПТОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

elems.loginElem = document.createElement("article");
elems.loginElem.innerHTML = `
   <h1>ЭЖ «Шкала»</h1>
   <input type="text" readonly id="uCateg" value="Учащийся"
          onClick="turnCateg()">
   <input type="text" id="uLogin" placeholder="Логин"
          onKeyDown="if (event.keyCode == 13) submLogin()">
   <input type="password" id="uPwd" placeholder="Пароль"
          onKeyDown="if (event.keyCode == 13) submLogin()">
   <img>
   <input type="tsxt" id="uCpt" placeholder="Код с картинки"
          onKeyDown="if (event.keyCode == 13) submLogin()">
   <button type="button" onClick="submLogin()">Вход</button>
   <div id="loginWarn">Не введен логин/пароль/код!</div>
`;
dqs("#content").appendChild(elems.loginElem);

let uToken = '', uCateg = '', uLogin = '', uCpt = '', apiResp = '', captId = 0,
    uTipes = {"Учащийся": "pupil", "Сотрудник": "staff", "Родитель": "par"},
    uTutorCls = [], uTeachLoad = {}, uRoles = []; 
if (!uLogin) dqs("article").style.display = "block";

// Параметры запроса к API сервера
const apiOpt = {method: "POST", cache: "no-cache", body: ''};

// Получаем капчу с сервера и ее Id
const getCapt = async () => {
   let cptResp = await fetch("/cpt.a");
   let cptImg  = await cptResp.blob();
   captId      = cptResp.headers.get("X-Cpt").trim();
   dqs("article img").src = URL.createObjectURL(cptImg);
};
getCapt();

// Обработка кликания на поле категории пользователя (циклическое переключение)
const turnCateg = () => {
   let cond = dqs("#uCateg").value;
   let valNew = (cond == "Учащийся") ?
      "Сотрудник" : ((cond == "Сотрудник") ? "Родитель" : "Учащийся");
   dqs("#uCateg").value = valNew;
   dqs("#uLogin").focus();
}

// Обработка отправки логина, пароля и капчи
const submLogin = async () => {
   uLogin = dqs("#uLogin").value.trim();
   uCateg = uTipes[dqs("#uCateg").value];
   uCpt = dqs("#uCpt").value.trim();
   if (!uLogin || !uPwd || !uCpt) dqs("#loginWarn").style.display = "block";
   else {
      dqs("#loginWarn").style.display = "none";
      apiOpt.body = `{
         "t":  "${uCateg}",
         "l":  "${uLogin}",
         "p":  "${dqs('#uPwd').value.trim()}",
         "f":  "login",
         "ci": "${captId}",
         "c":  "${uCpt}"
      }`;         
      apiResp = await (await fetch("/", apiOpt)).text();
      if (apiResp == "none") {
         dqs("#loginWarn").innerHTML = "Неверный логин/пароль/код!";
         dqs("#loginWarn").style.display = "block";
         getCapt();
      }
      else {
         // Чистим все переменные, содержащие пароль и Id капчи
         dqs('#uPwd').value = '';
         apiOpt.body = '';
         captId = 0;
            
         // Сохраняем токен, его роли, перечень классов, где он
         // классный руководитель, его педагогическую нагрузку
         // типа {"8Б": ["s230", "d710"], "10Ж": ["s110"]}
         let apiRespObj = JSON.parse(apiResp);
         uRoles         = apiRespObj.roles;
         uToken         = apiRespObj.token;
         uTutorCls      = apiRespObj.tutClss   || [];
         uTeachLoad     = apiRespObj.teachLoad || {};
         
         dqs("article").style.display = "none";
         
         // Загружаем необходимые скрипты и публикуем контент страницы
         // (menuItems определен в ini.js)
         let requires = ["info"];
         let rlsArr = ["pupil"];
         if (uLogin == "admin") rlsArr = ["root"];
         else if (uCateg == "staff") {
            rlsArr = ["admin", "teacher", "tutor"];
            requires.push("reglib");
         }
         for (let currRole of rlsArr)
            for (let rlItem of menuItems[currRole]) requires.push(rlItem[0]);
         requires.push("header");
         
         let scriptElem;
         for (let scrName of new Set(requires)) {
            scriptElem = document.createElement("script");
            scriptElem.src = `js/${scrName}.js`;
            scriptElem.async = false;
            document.body.appendChild(scriptElem);
         }         
         scriptElem.onload = () => headerGen();
         
         // Проверяем и публикуем информацию о новых заметках для юзера
         if (uLogin != "admin" && uCateg != "staff") {
            let apiResp = await apireq("notesCheck", [uLogin, uCateg]);
            if (apiResp != "none") {
               dqs("aside").style.display = "block";
               dqs("aside").title = "Для вас имеются новые заметки";
            }
         }
      }
   }
}
dqs("#uLogin").focus();
