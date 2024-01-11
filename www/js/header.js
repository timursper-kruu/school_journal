/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: ХИДЕР, МЕНЮ И ФУТЕР СТРАНИЦ ЖУРНАЛА
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Показ блоков страницы в зависимости от выбранного пункта меню
const blockShow = menuItem => {
   // Подсвечиваем выбранный пункт меню
   for (let mn of document.querySelectorAll("nav li"))
      mn.classList.remove("sel");
   dqs(`#mn${menuItem}`).className = "sel";
   
   // Сворачиваем мобильное меню
   if (dqs("header img").src.includes("MobClose")) dqs("header img").click();
   
   // Показываем соответствующий блок контента
   for (let sect of document.querySelectorAll("section"))
      sect.style.display = "none";
   dqs(`#${menuItem}`).style.display = "block";
   
   // Вызываем необходимую для этого блока функцию для подгрузки контента
   // (функции подгрузки для каждого блока определены в самих скриптах блоков)
   if (getContent[menuItem]) getContent[menuItem]();
};

// Генерирование меню в зависимости от выбранной роли пользователя
// (константа menuItems определена в ini.js)
const menuGen = () => {
   let role = dqs("#selRole").value;
   let res = "<ul>";
   for (let mi of menuItems[role])
      res += `<li id="mn${mi[0]}" onClick="blockShow('${mi[0]}')">${mi[1]}</li>\n`;
   res += "</ul>";
   dqs("nav").innerHTML = res;
   blockShow(menuItems[role][0][0]);
   dqs("#selRole").blur();
};

// Формирование опций для селекта выбора роли пользователя
// (константа roleNames определена в ini.js)
const headerOptGen = roles => {
   let res = '';
   for (let i = 0; i < roles.length; i++)
      res += `<option value=${roles[i]}>${roleNames[roles[i]]}</option>`;
   return res;
};

// Обработка кликания на иконке мобильного меню
const showMenuMob = () => {
   let mmiDisp = dqs("nav").style.display || "none";
   dqs("nav").style.display =
      (mmiDisp == "none") ? "block" : "none";
   dqs("header img").src =
      (mmiDisp == "none") ? "static/menuMobClose.svg" : "static/menuMob.svg";
}

// Запрос к API для смены пароля и сообщение о результате
const chPwdApi = async () => {
   let pwd  = dqs("#newPwd").value.trim(),
       pwd1 = dqs("#newPwd1").value.trim();
       
   dqs("#chPwdWarn").style.display = "none";
   if (pwd != pwd1) {
      dqs("#chPwdWarn").innerHTML = "Пароли не совпадают!";
      dqs("#chPwdWarn").style.display = "block";
      return;
   }
   if (pwd.length < 8) {
      dqs("#chPwdWarn").innerHTML =
         "Пароль должен содержать<br>не менее 8 символов!";
      dqs("#chPwdWarn").style.display = "block";
      return;
   }
   let apiResp = await apireq("usChPwd", [uLogin, pwd]);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      dqs("#chPwdWin").style.display = "none";
      info(0,
        "Пароль успешно заменен.<br>Авторизуйтесь заново с новым паролем.");
      document.body.onclick = () => location.reload();
   }
}

// Показ модального окна для смены пароля
const chPwd = () => {
   let role = dqs("#selRole").value;
   if (role == "root") info(1,
      "Смена пароля главного администратора веб-интерфейсом невозможна.");
   else if (role == "pupil" || role == "parent") info(0,
      "Для смены пароля обратитесь к администратору электронного журнала.");
   else {
      elems.chPwdElem = document.createElement("div");
      elems.chPwdElem.innerHTML = `
         <h1>Смена пароля</h1>
         <input type="password" id="newPwd" placeholder="Пароль">
         <input type="password" id="newPwd1" placeholder="Повторите пароль"
                onKeyDown="if (event.keyCode == 13) chPwdApi()">
         <button type="button" onClick="chPwdApi()">Сменить пароль</button>
         <button id="clButt" type="button" onClick="elems.chPwdElem.remove()"
            style="margin-top:-30px">Отмена</button>
         <div id="chPwdWarn"></div>
      `;
      elems.chPwdElem.id = "chPwdWin";
      dqs("#content").appendChild(elems.chPwdElem);
      elems.chPwdElem.style.display = "block";
      dqs("#newPwd").focus();
   }
}

// Формирование хидера и включение футера
const headerGen = async () => {
   
   dqs("#content").innerHTML += `
      <header>
         <img src="static/menuMob.svg" title="Меню" onClick="showMenuMob()">
         <span id="progName">ЭЖ «Шкала»</span>
         <span>${uLogin}:<span>
         <select id="selRole" onChange="menuGen()" title="Роль пользователя">
            ${headerOptGen(uRoles)}
         </select>
         <span id="chPwd" title="Сменить пароль" onClick="chPwd()">&#9874;</span>
         <a href='' title="Выход">&#9635;</a>
      </header>
      <nav></nav>
   `;
   menuGen();
   
   try {
      let adminCont = await (await fetch("/a.a")).text();
      let versCont = await (await fetch("/history.html", {method: "GET"})).text();
      let histUrl = URL.createObjectURL(new Blob([versCont], {type: "text/html"}));
      versCont = versCont.split("<pre>")[1].trim().split(' ')[0];
      dqs("footer").innerHTML += `Адм.: ${adminCont} &bull;
         <a href=${histUrl} target="_blank">v.&nbsp;${versCont}</a>`;
      dqs("footer").style.display = "block";
   } catch(e) {;}
};
