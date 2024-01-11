/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: БЛОК РЕДАКТИРОВАНИЯ СПИСКА ПРЕДМЕТОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Объект названий предметов {"s110": "Русский язык", ...}
// (в ini.js определен еще объект названий предметов по умолчанию subjDef)
let subjList = {};

// Публикация списка предметов на страничке из объекта sbObj
const sbListPubl = sbObj => {
   // Сначала сортируем объект по числовым полям ключей (d480 > s110),
   // затем публикуем с иконками удаления (только для ключей, начинающихся с d)
   let sbObjSort = subjSort(sbObj); // определена в ini.js
   let cont = '';
   for (let sbKey in sbObjSort) {
      let divDel = (sbKey[0] == 'd') ?
          `<div onclick="subjDel('${sbKey}')" title="Удалить">&#10060;</div>` :
          "<div class='noCur'></div>";
      let divEdit = (sbKey[0] == 'd') ?
          `<div onclick="subjEdit.getInp('${sbKey}', '${sbObjSort[sbKey]}')" title="Редактировать">&#9874;</div>` :
          "<div class='noCur'></div>";
      cont += `<span id="sb-${sbKey}">${divDel}${divEdit}`
            + `${sbKey.substr(1,3)}&emsp;${sbObjSort[sbKey]}</span>`;
   }
   dqs("#sbList").innerHTML = cont;  
};

// Отправка запроса к API для добавления дополнительного предмета
const subjAdd = async () => {
   let newSubjKey  = 'd' + dqs("#sbNewKod").value.trim();
   let newSubjName = dqs("#sbNewName").value.trim();
   dqs("#sbNewKod").value  = '';
   dqs("#sbNewName").value = '';
   
   let rK = /^d\d{3}$/;
   if (!rK.test(newSubjKey)) {
      info(1, "Условный номер имеет неверный формат.");
      return;
   }
   
   if (!newSubjName) {
      info(1, "Не указано наименование предмета.");
      return;
   }
   
   let rN = /^[A-Za-z0-9А-Яа-яЁё(). \-]{2,30}$/;
   if (!rN.test(newSubjName)) {
      info(1, "Наименование предмета может содержать от 2 до 30 букв русского "
            + "и латинского алфавитов, дефисов, цифр, скобок, точек и пробелов.");
      return;
   }
   
   if (Object.keys(subjList).includes(newSubjKey) ||
       Object.keys(subjList).includes(newSubjKey.replace('d', 's'))) {
      info(1, "Предмет с таким условным номером уже существует.");
      return;
   }
   
   let apiResp = await apireq("subjAdd", [newSubjKey, newSubjName]);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      subjList[newSubjKey] = newSubjName;
      sbListPubl(subjList);
   }
};

// Удаление дополнительного предмета
const subjDel = async (sbDelKey) => {
   if (!confirm("Вы уверены?")) return;
   let apiResp = await apireq("subjDel", sbDelKey);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      delete subjList[sbDelKey];
      sbListPubl(subjList);
   }
}

// Редактирование названия предмета
const subjEdit = {
   getInp: (sbKey, oldName) => {   
      dqs(`#sb-${sbKey}`).innerHTML =
         `<input class="sbEd" type="text" value="${oldName}"
           onKeyDown="if (event.keyCode == 13)
           subjEdit.subm('${sbKey}', this.value)">`;
   },
   subm: (sbKey, newName) => {
      newName = newName.trim();
      let rN = /^[A-Za-z0-9А-Яа-яЁё(). \-]{2,30}$/;
      if (!rN.test(newName)) {
         info(1, "Наименование предмета может содержать от 2 до 30 букв "
               + "русского и латинского алфавитов, дефисов, цифр, скобок, точек "
               + "и пробелов.");
         return;
      }
      // Отправляем запрос к API на редактирование,
      // в случае успеха публикуем обновленные данные
      (async () => {
         let apiResp = await apireq("subjEdit", [sbKey, newName]);
         if (apiResp == "none") {
            info(1, "Запрашиваемая операция отклонена.");
            sbListPubl(subjList);
         }
         else {
            subjList[sbKey] = newName;
            sbListPubl(subjList);
         }
      })();
   }
}

// Формирование контента странички
createSection("subjects", `
   <h3>Список предметов</h3>
   <div id="sbList"></div><br>
   <input type="text" id="sbNewKod" placeholder="Условный номер"
      onKeyDown="if (event.keyCode == 13) subjAdd()">
   <input type="text" id="sbNewName" placeholder="Наименование"
      onKeyDown="if (event.keyCode == 13) subjAdd()">
   <button type="button" onclick="subjAdd()">Добавить</button>
`);

// Динамически подгружаем список предметов в объект subjList (сливаем объект
// названий предметов по умолчанию subjDef и то, что получено с помощью API)
// и публикуем его на страничке (имя метода = имени пункта меню!)
getContent.subjects = async () => {
   let apiResp = await apireq("subjList");
   let subjListDop = JSON.parse(apiResp);
   
   // Оставляем собственно предметы, убираем межклассные группы
   for (let kod of Object.keys(subjListDop))
      if (kod[0] != 's' && kod[0] != 'd') delete subjListDop[kod];

   subjList = {...subjDef, ...subjListDop};
   sbListPubl(subjList);
}
