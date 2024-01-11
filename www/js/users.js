/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: БЛОК РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Строка со списком классов для формирования селектов выбора класса
// (подгружается с помощью API в конце этого модуля)
let clListSel = '';

// Циклическое переключение поля категории юзера и отображение поля
// выбора класса в форме поиска пользователя
const usFindCategTurn = () => {
   let ucField = dqs("#usFindCateg");
   if (ucField.value == "Учащийся") {
      ucField.value = "Учитель";
      dqs("#usFindClass").value = '0';
      dqs("#usFindClass").style.display = "none";
   }
   else {
      ucField.value = "Учащийся";
      dqs("#usFindClass").style.display = "inline-block";
   }
}

// Поиск пользователя и выдача результатов
const userFind = async () => {
   let usStatus    = dqs("#usFindCateg").value.trim() || "Учащийся";
   let usFindClass = dqs("#usFindClass").value.trim() || '0';
   let usFindFIO   = dqs("#usFindFIO").value.trim()   || '';
   if (usFindClass == '0' && !usFindFIO) {
      info(1, "Задайте условие поиска");
      return;
   }
   if (usFindClass == '0' && usFindFIO.length < 3) {
      info(1, "В поле «ФИО» должно быть не менее трех символов.");
      return;
   }
   dqs("#usFindResult").innerHTML = "Производится поиск...";
   let usFindRes = "Пользователи не найдены";
   let apiResp = await apireq("usFind", [usStatus, usFindClass, usFindFIO]);
      
   if (apiResp != "none") {
      let isPup        = (usStatus == "Учащийся"),
          setAdmTh     = isPup ? '' : "<td>&nbsp;</td>",
          setAdmInner  = isPup ? '' :
                         `<td title="Назначить администратором"
                              onClick="setAdmin('{{usName}}')">&#9398;</td>`,
          name2th      = isPup ? '' : "<th>Отчество</th>",
          unitTh       = isPup ? "<th>Класс</th>" : '';
         
      usFindRes = `
         <table><tr><th>Логин</th><th>Фамилия</th><th>Имя</th>
         ${name2th}${unitTh}<th>&nbsp;</th>${setAdmTh}<th>&nbsp;</th>`;
            
      let apiFindResult = JSON.parse(apiResp).sort(
         (u1, u2) => (u1.famil).localeCompare(u2.famil, "ru")
      );

      for (let currUser of apiFindResult) {
         let unitInner  = isPup ? `<td class="un">${currUser.unit}</td>` : '',
             name2inner = isPup ? '' : `<td>${currUser.name2}</td>`,
             setAdmInnerCurr = currUser.admin ? 
                "<td title='Является администратором'>A</td>" :
                setAdmInner,
             color = '',
             tdEdit = `
                <td title="Редактировать"
                onClick="userFormGen('edit', [
                '${usStatus}', '${currUser.login}', '${currUser.famil}',
                '${currUser.name}', '${currUser.name2}', '${currUser.unit}',
                '********', '********'                      
                ])">&#9874;</td>
             `,
             tdBlock = `
                <td title="Заблокировать"
                onClick="usBlock('${currUser.login}', 'block')">&#10060;</td>
             `;
                   
         if (currUser.block) {
            color = " class='blk'";
            tdBlock = `
               <td title="Разблокировать"
               onClick="usBlock('${currUser.login}', 'unblock')">&#10004;</td>
            `;
            tdEdit = "<td>&nbsp;</td>";
            setAdmInnerCurr = isPup ? '' : "<td>&nbsp;</td>";
         }

         usFindRes += `<tr${color}>
            <td>${currUser.login}</td><td>${currUser.famil}</td>
            <td>${currUser.name}</td>${name2inner}${unitInner}
            ${tdEdit}
            ${setAdmInnerCurr.replace("{{usName}}", currUser.login)}
            ${tdBlock}
         </tr>`;
      }         
      usFindRes += "</table>";
   }
      
   dqs("#usFindResult").innerHTML = usFindRes;
}

// Кнопка для генерирования/отключения формы добавления нового юзера
const nuFormButt = `
   <button type="button" id="addUser" onclick="userFormGen('add')">
   + Добавить пользователя</button>`;
   
// Сервис импорта юзеров из файла
const loadUsFile = () => {
   let reader = new FileReader();
   reader.onload = async (dt) => {
      let impUsStr = dt.target.result.replace(/\r/g, '').replace(/\n/g, '^');
      let apiResp = await apireq("usImport", impUsStr);
      if (apiResp == "none") info(1, "Ошибка. Импорт не произведен.");
      else if (/^[0-9\-]+$/.test(apiResp)) {
         let usImpVal = apiResp.split('-')[0],
             usIgnVal = apiResp.split('-')[1];
         info(0, `Импортировано: ${usImpVal}.<br>Пропущено: ${usIgnVal}.`);
      }
      else info(1, `Ошибка. Пользователь ${apiResp} `
                 + "и последующие не импортированы.");
   };
   reader.onerror = e => info(1, "Ошибка чтения файла.");
   reader.readAsText(dqs("#loadUsFile").files[0]);
}
const nuImportButt = `
   <input id="loadUsFile" type="file" onChange="loadUsFile()">
   <button type="button" id="importUser" onclick="dqs('#loadUsFile').click()">
      Импорт пользователей из файла</button>
   <a href="static/impUsTpl.html"
      target="_blank" class="btn">(требования&nbsp;к&nbsp;файлу)</a>`;   

// Циклическое переключение поля категории юзера и отображение полей
// выбора класса и отчества в форме добавления/редактирования пользователя
// Аргумент 0 - традиционное переключение, 1 - первичное (не по клику на поле)
const newCategTurn = (arg = 0) => {
   let ncField = dqs("#newUcateg");
   if (
      (ncField.value == "Учащийся" && !arg) ||
      (ncField.value == "Учитель" && arg)) {
      ncField.value = "Учитель";
      dqs("#newUclass").style.display = "none";
      dqs("#newUotch").style.display  = "block";
   }
   else {
      ncField.value = "Учащийся";
      dqs("#newUclass").style.display = "block";
      dqs("#newUotch").style.display  = "none";
   }
}

// Генерирование формы добавления/редактирования пользователя
// Первый аргумент: add - добавление, edit - редактирование
// Второй аргумент: подставляемые значения полей (массив)
const userFormGen =
   (func, vals = ["Учащийся", '', '', '', '', 0, '', '']) => {
   if (!clList) {info(1, "Не получен список классов"); return;}
   const zagol = {add:"Новый пользователь", edit:"Редактирование пользователя"},
      passWarnTxt = {add:'',
         edit:"<p>Если вы не изменяете пароль,<br>не редактируйте эти поля</p>"},
      admWarnTxt = {add:'',
         edit:"<p>Если пользователь являлся администратором,<br>"
             +"после редактирования этот статус сбросится!</p>"};
   let formInner = `<h3>${zagol[func]}</h3>
      <input type="hidden" id="addOrEdit" value="${func}">
      <input type="text" id="newUcateg" readonly value="${vals[0]}"
             onClick="newCategTurn()">
      ${admWarnTxt[func]}
      <input type="text" id="newUlogin" placeholder="Логин"
         value="${vals[1]}">
      <input type="text" id="newUfamil" placeholder="Фамилия"
         value="${vals[2]}">
      <input type="text" id="newUname"  placeholder="Имя"
         value="${vals[3]}">
      <input type="text" id="newUotch"  placeholder="Отчество"
         value="${vals[4]}">      
      <select id="newUclass">${clListSel}</select>
      ${passWarnTxt[func]}
      <input type="password" id="newUpwd" placeholder="Пароль"
         value="${vals[6]}">
      <input type="password" id="newUpwd1" placeholder="Повтор пароля"
         value="${vals[7]}">      
      <button type="button" onclick="userAddEdit(0)">Сохранить</button>
   `;   
   dqs("#addEditUser").innerHTML  = formInner;
   if (vals[5]) dqs("#newUclass").value = vals[5];   
   dqs("#newUotch").style.display = "none";
   newCategTurn(1);
   dqs("#newUlogin").focus();
   
   dqs("#addUser").outerHTML = `
      <button type="button" id="addUser" onclick="userAddEdit(1)">
      Закрыть без сохранения</button>
   `;
};

// Добавление/редактирование пользователя
// (аргумент 1 - ничего не делать, просто закрыть форму)
const userAddEdit = async (arg) => {
   let newUser = {}, checkLogin = true, operAdd = 0;
   if (!arg) {
      const newUsFields = ["Ulogin", "Ufamil", "Uname", "Uotch", "Ucateg",
                           "Uclass", "Upwd", "Upwd1"];      
      for (let field of newUsFields) {
         newUser[field] = dqs(`#new${field}`).value.trim() || '';
         if (!newUser[field] && (field != "Uotch")) {            
            info(1, "Заполнены не все поля!");
            return;
         }
      }
      let pLgn = /^[a-z0-9]+$/;
      if (!pLgn.test(newUser["Ulogin"])) {
         info(1, "Логин может состоять только из строчных "
               + "букв латинского алфавита и цифр.");
         return;
      }
      if (newUser.Upwd != newUser.Upwd1) {
         info(1, "Пароли не совпадают.");
         return;
      }
      delete newUser.Upwd1;
      if (newUser.Ucateg == "Учащийся") delete newUser.Uotch;
      else                              delete newUser.Uclass;
      
      // Если это добавление, а не редактирование, проверяем, свободен ли логин      
      if (dqs("#addOrEdit").value == "add") {
         operAdd = 1;
         await (async () => {
            let apiResp = await apireq("usFindLogin", newUser["Ulogin"]);
            if (apiResp == "none") {
               info(1, "Запрашиваемая операция отклонена.");
               checkLogin = false;
            }
            else if (apiResp == "busy") {
               info(1, "Пользователь с таким логином уже существует.");
               checkLogin = false;
            }
         })();
      }
   }
   if (!checkLogin) return;
   dqs("#addEditUser").innerHTML = '';
   dqs("#addUser").outerHTML     = nuFormButt;
   if (arg) return;
   
   // Посылаем запрос к API на добавление/редактирование
   let apiResp = await apireq("usAddEdit", newUser);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      if (!operAdd) userFind();
      info(0,
      `Пользователь ${newUser.Ulogin} успешно добавлен (отредактирован).`);         
   }
}

// Назначение пользователя администратором
// (в вызове API второй аргумент set - назначить, unset - разжаловать)
const setAdmin = async (login) => {
   if (!confirm("Вы уверены?")) return;
   let apiResp = await apireq("usSetAdmin", [login, "set"]);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else if (apiResp == "already")
      info(1, `Пользователь ${login} уже является администратором.`);
   else {
      userFind();
      info(0, `Пользователь ${login} успешно назначен администратором.`);
   }
}

// Блокирование/разблокирование юзера
// (в вызове API второй аргумент block либо unblock)
const usBlock = async (login, func) => {
   if (!confirm("Вы уверены?")) return;
   const warn = {"block": "заблокирован", "unblock": "разблокирован"};
   let apiResp = await apireq("usBlock", [login, func]);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else if (apiResp == "already")
      info(1, `Пользователь ${login} уже ${warn[func]}.`);
   else {
      userFind();
      info(0, `Пользователь ${login} успешно ${warn[func]}.`);
   }
}

// Формирование контента странички
createSection("users", `
   <div id="addEditUser"></div>
   ${nuFormButt}${nuImportButt}
   <h3>Поиск пользователей</h3>
   <div id="findUser">
      <input type="text" id="usFindCateg" readonly value="Учащийся"
             onClick="usFindCategTurn()">
      <select id="usFindClass">
         <option value="0">Любой класс</option>
      </select>
      <input type="text" id="usFindFIO" placeholder="ФИО"
             onKeyDown="if (event.keyCode == 13) userFind()">     
      <button type="button" onclick="userFind()">Искать</button>
   </div>
   <div id="usFindResult"></div>
`);

// Динамически подгружаем список классов в строку clList для селекта
// Имя метода = имени пункта меню!
getContent.users = async () => {
   if (!clListSel) {
      let apiResp = await apireq("classesList");
      let clListArr = classSort(JSON.parse(apiResp));
      for (let cl of clListArr) clListSel += `<option>${cl}</option>`;
      dqs("#usFindClass").innerHTML += clListSel;
   }
}
