/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: БЛОК РЕДАКТИРОВАНИЯ СПИСКА СВОДНЫХ ГРУПП
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";
let ingrList = [], ingrTeachList = {};

// Публикация списка групп на страничке из массива ingrArr
const ingrListPubl = ingrArr => {
   if (!ingrArr.length) {
      dqs("#ingrList").innerHTML = "<p>Межклассных групп пока нет.</p>";
      return;
   }   
   // Сортируем массив и публикуем с иконками удаления и редактирования
   ingrArr.sort((a, b) => a[0].localeCompare(b[0], "ru"));
   let cont = '';
   for (let cGr of ingrArr) {
      let
         divDel   = `<div onclick="ingrDel('${cGr[0]}')"
            title="Удалить">&#10060;</div>`,
         divName  = `<div>${cGr[0]}</div>`,
         divTitle = `<div>${cGr[1]} (${ingrTeachList[cGr[2]]})</div>`;
         
      cont += `<span>${divDel}${divName}${divTitle}</span>`;
   }
   dqs("#ingrList").innerHTML = cont;  
};

// Отправка запроса к API для добавления/редактирования группы
const ingrEdit = async () => {   
   let namesArr = ingrList.map(x => x[0]); 
   
   let grNameNum  = dqs("#ingrNewNameNum").value || "20",
       grName     = grNameNum + dqs("#ingrNewNameLit").value,
       grTitle    = dqs("#ingrNewTitle").value.trim(),
       grTeach    = dqs("#ingrNewTeach").value;
   
   dqs("#ingrNewNameNum").value = '';
   dqs("#ingrNewNameLit").value = 'А';
   dqs("#ingrNewTitle").value   = '';
   dqs("#ingrNewTeach").selectedIndex = 0;
   
   if (!grTitle) {
      info(1, "Не указано наименование предмета внеурочной деятельности.");
      return;
   }
   
   let rN = /^[A-Za-z0-9А-Яа-яЁё(). \-]{2,100}$/;
   if (!rN.test(grTitle)) {
      info(1, "Наименование предмета может содержать от 2 до 100 букв русского "
            + "и латинского алфавитов, дефисов, цифр, скобок, точек и пробелов.");
      return;
   }
   
   if (namesArr.includes(grName)) {
      let mess = `Данные группы ${grName} будут перезаписаны. Вы уверены?`;
      if (!confirm(mess)) return;
   }
   
   let apiResp = await apireq("interGroupEdit", [grName, grTitle, grTeach]);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      if (namesArr.includes(grName))
         ingrList[namesArr.indexOf(grName)] = [grName, grTitle, grTeach];
      else ingrList.push([grName, grTitle, grTeach]);
      ingrListPubl(ingrList);
   }
};

// Удаление группы
const ingrDel = async (grName) => {
   if (!confirm(
      "Все учащиеся должны быть предварительно удалены из группы. "
    + "Все темы занятий и все отметки будут удалены. Вы уверены?"
   )) return;
   let apiResp = await apireq("interGroupDel", grName);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      ingrList.splice(ingrList.map(x => x[0]).indexOf(grName), 1);
      ingrListPubl(ingrList);
   }
}

// Формирование контента странички
createSection("groups", `
   <h3>Межклассные группы обучающихся</h3>
   <div id="ingrList"></div>
   <h3>Добавление/редактирование группы</h3>
   <p>При добавлении группы укажите ее условный номер (типа <b>23Б</b>, числа
      от 20 до 99), наименование предмета внеурочной деятельности (факультатива,
      кружка, секции и пр., например, <b>Вязание крючком</b> или <b>Олимпиадная
      химия</b>), для которого создана группа, а также учителя, ведущего занятия
      в этой группе. Если вы укажете условный номер уже существующей группы, её
      данные будут перезаписаны.</p>
   <input type="number" id="ingrNewNameNum" min=20 max=99 placeholder=20>
   <select id="ingrNewNameLit"></select>
   <input type="text" id="ingrNewTitle" maxlength="100"
          placeholder="Наименование предмета ВД">
   <select id="ingrNewTeach"></select>
   <button type="button" onclick="ingrEdit()">Добавить/Редактировать</button>
`);

let ingrLiterArr = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ",
    ingrSelLiter = '';
for (let iLit of ingrLiterArr) ingrSelLiter += `<option>${iLit}</option>`;
dqs("#ingrNewNameLit").innerHTML = ingrSelLiter;

// Получаем массив с логинами и фио учителей; заполняем select выбора учителя.
// Динамически подгружаем список групп в массив ingrList
// и публикуем его на страничке (имя метода = имени пункта меню!)
getContent.groups = async () => {
   let apiResp = await apireq("teachList");
   let teachArr = JSON.parse(apiResp);
   teachArr.sort((a, b) => a.fio.localeCompare(b.fio, "ru"));
   for (let teach of teachArr)
      ingrTeachList[teach.login] = teach.fio;
      
   let selInner = '';
   for (let tch of teachArr)
      selInner += `<option value="${tch.login}">${tch.fio}</option>`;
   dqs("#ingrNewTeach").innerHTML = selInner;
   
   apiResp = await apireq("interGroupList");
   ingrList = JSON.parse(apiResp);
   ingrListPubl(ingrList);   
}
