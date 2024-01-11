/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: РАЗБИЕНИЕ КЛАССА НА ПОДГРУППЫ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Переключение содержимого ячейки таблицы с галочки на пустую и обратно
const turnMark = elem => {
   elem.innerHTML = elem.innerHTML ? '' : '■';
}

// Добавление/удаление подгруппы из списка
// (имя подгруппы типа "мальч" без префикса класса!)
// f - это "add" или "del"
const subGrEdit = async (sbGrName, f) => {
   let className = dqs("#sgrClassSel").value;
   if (f == "del")
      if (!confirm(`Удалить подгруппу "${sbGrName}"?`)) return;
   if (f == "add") {
      sbGrName = dqs("#subGrNew").value.trim();
      if (!sbGrName) {info(1, "Введите имя подгруппы!"); return;}
      if (!/^[а-яё0-9]{1,10}$/.test(sbGrName)) {
         info(1, "Имя подгруппы может<br>содержать от 1 до 10<br>строчных "
               + "русских букв<br>и (возможно) цифр.");
         return;         
      }
   }
   dqs("#subGrNew").value = '';
   
   let fullName = `${className}-${sbGrName}`;
   let apiResp = await apireq("subgrEdit", [className, fullName, f]);
   if (apiResp == "none") {info(1, "Ошибка на сервере"); return;}
   else subGroupsLoad(className);
}

// Получение списка существующих подгрупп данного класса
const subGroupsLoad = async (className) => {
   let apiResp = await apireq("classesGroups");
   if (apiResp != "none") {
      let groupsList = JSON.parse(apiResp);
      groupsList = groupsList.filter(x => {
         if (x.includes('-')) return (x.split('-')[0] == className);
         else return false;
      });
      // Если подгруппы есть, публикуем их с иконками удаления
      if (groupsList.length) {
         groupsList = groupsList
                    . map(x => x.replace(className + '-', '')).sort();
         let cont = '';
         for (let sGroup of groupsList)
            cont += `<div><div onclick="subGrEdit('${sGroup}', 'del')">`
                  + `&#10060;</div>${sGroup}</div>`;
         dqs("#subGrList").innerHTML = cont;
         
         // Формируем селект выбора подгруппы для редактирования ее состава
         let inner = '';
         for (let gr of groupsList) inner += `<option>${gr}</option>`;
         dqs("#sgrGroupSel").innerHTML = inner;
         subGroupPups(groupsList[0]);
      }
      else dqs("#subGrList").innerHTML = "Подгрупп не найдено";
   }
   else dqs("#subGrList").innerHTML = "Подгрупп не найдено";   
}

// Публикация формы редактирования списочного состава одной подгруппы
// (имя подгруппы типа "мальч" без префикса класса!)
const subGroupPups = async (sbGrName) => {
   let className = dqs("#sgrClassSel").value,
       fullName  = `${className}-${sbGrName}`,
       cont      = '';
       
   let apiResp = await apireq("gradesGet", [className, '', "a"]);
   if (apiResp != "none") {
      let rObj = JSON.parse(apiResp);
      
      // Получаем логины членов подгруппы
      let grResp = await apireq("gradesGet", [fullName, '', "a"]);
      if (grResp == "none") {info(1, "Ошибка на сервере"); return;}
      let grObj = JSON.parse(grResp);
      let grArr = grObj.puList ? grObj.puList : [];
      
      cont += "<table>";
      for (let i = 0; i < rObj.puList.length; i++) {
         let checked = grArr.includes(rObj.puList[i]) ? '■' : '';
         cont += `<tr data-uid="${rObj.puList[i]}">
            <td>${rObj.pnList[i]}</td>
            <td onClick="turnMark(this)">${checked}</td>
         </tr>`;
      }
      cont += "</table>";
      cont += `<button type="button" onClick="sgrPupsEd('${fullName}')"
         >Сохранить изменения</button>`;
   }
   else cont = "Список учащихся не получен с сервера"
   dqs("#subGrEdit").innerHTML = cont;
}

// Редактирование списочного состава одной подгруппы (запрос к API)
const sgrPupsEd = async (subrgName) => {
   // Формируем массив логинов отмеченных учащихся
   // (самый первый элемент - название подгруппы!)
   let grLoginsArr = [subrgName];
   let trElems = document.querySelectorAll("#subgroup table tr");
   for (let tr of trElems)
      if (tr.innerHTML.includes('■')) grLoginsArr.push(tr.dataset.uid);
      
   // Отправляем запрос к API
   info(0, "Ждите...<br><img src='static/preloader.gif'>");
   let grResp = await apireq("subgrPups", grLoginsArr);
   if (grResp == "none") {info(1, "Ошибка на сервере"); return;}
   else info(0, "Состав подгруппы успешно обновлен.");
}

// Формируем контент странички
createSection("subgroup", `
   <select id="sgrClassSel" onChange="subGroupsLoad(this.value);"></select>
   <h3>Подгруппы вашего класса</h3>
   <div id="subGrList"></div>
   <input id="subGrNew" maxlength="10" placeholder="Новая подгруппа"
          onKeyDown="if (event.keyCode == 13) subGrEdit('', 'add')">
   <button type="button" onClick="subGrEdit('', 'add')">Добавить</button>
   <h3>Редактирование состава подгруппы</h3>
   <select id="sgrGroupSel" onChange="subGroupPups(this.value);"></select>
   <div id="subGrEdit"></div>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.subgroup = async () => {
   
   // Формирование списка классов в селекте (uTutorCls определен в login.js)   
   let sgrSelClInner = '';
   for (let cls of uTutorCls) sgrSelClInner += `<option>${cls}</option>`;
   dqs("#sgrClassSel").innerHTML = sgrSelClInner;
   
   // Загружаем список подгрупп {первого класса в списке классов}
   subGroupsLoad(dqs("#sgrClassSel").value);
}
