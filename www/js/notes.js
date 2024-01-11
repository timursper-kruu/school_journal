/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: ЗАМЕТКИ УЧИТЕЛЕЙ ДЛЯ РОДИТЕЛЕЙ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Максимальное число знаков в заметке (на серверной стороне режется по 500)
const NTVAL = 200;

// Фокус на поле добавления новой заметки
const inpFocus = () => dqs("#ntAddForm textarea").focus();

// Подсчет знаков в поле добавления заметки
const ntCount = () => {
   let val = dqs("#ntAddForm textarea").value.length;
   dqs("#ntAddForm span:first-child").innerHTML = val;
   dqs("#ntAddForm span:nth-child(2)").innerHTML = NTVAL - val;
}

// Удаление заметки по ее id
const ntDel = async (id) => {
   if (!confirm("Вы уверены?")) return;
   let apiResp = await apireq("notesDel", [id]);
   if (apiResp != "none") ntShow('');
   else info(1, "Ошибка на сервере,<br>заметка не удалена.");
}

// Показ всех заметок (если pupil == '', показываются заметки, добавленные
// пользователем-сотрудником, иначе заметки для ученика и его класса/групп)
const ntShow = async pupil => {
   dqs("#ntResult").innerHTML = "<img src='static/preloader.gif'>";
   let ntResp = await apireq("notesGet", [pupil]);
   if (ntResp == "none") {
      info(1, "Ошибка на сервере.<br>Заметки не получены.");
      return;
   }
   let notesArr = JSON.parse(ntResp);
   if (!notesArr.length) {
      dqs("#ntResult").innerHTML = `<p><b>Заметок нет</b></p>`;
      return;
   }
   let res = "<table><tr><th>&nbsp;</th><th>Дата</th><th>Кому</th>"
           + "<th>От&nbsp;кого</th><th>Текст заметки</th></tr>";
   for (let i=0; i< notesArr.length; i++) {
      let dtArr = (notesArr[i].dt.split(' ')[0]).split('-'),
          dt    = `${dtArr[2]}.${dtArr[1]}`,
          rcpt  = notesArr[i].rf.replace(/\s/g, "&nbsp;"),
          auth  = notesArr[i].af.replace(/\s/g, "&nbsp;");
          
      let role = dqs("#selRole").value;
      let del = (role == "pupil" || role == "parent") ?
         `<td>${i+1}</td>` : `<td title="Удалить заметку" ` +
         `onClick=ntDel("${notesArr[i]._id}")>&#10060;</td>`;

      res += `<tr>${del}<td>${dt}</td><td>${rcpt}</td>`
           + `<td>${auth}</td><td>${notesArr[i].t}</td></tr>`;
   }
   dqs("#ntResult").innerHTML = res + "</table>";
}

// Добавление заметки
const ntAdd = async () => {
   let ntRcpt = dqs("#ntSelPupil").value.trim(),
       ntText = dqs("#ntAddForm textarea").value.trim();
   if (!ntRcpt) {info (1, "Не выбран учащийся!"); return;}
   if (!ntText) {info (1, "Не введен текст заметки!"); return;}
   
   let ntResp = await apireq("notesAdd", [ntRcpt, ntText]);
   if (ntResp == "none") {
      info(1, "Ошибка на сервере.<br>Заметка не добавлена.");
      return;
   }
   info (0, "Заметка успешно добавлена.");
   ntShow('');
}

// Формирование списка детей в селекте выбора учащегося
const ntPupListShow = async () => {
   let clName = dqs("#ntSelClass").value,
       ntResp, pupLgnArr, pupFioArr;

   // Это межклассная группа (false) или обычный класс (true)?
   let isCl = Number(clName.substr(0, clName.length - 1)) > 19 ? false : true;

   // Получаем список учащихся
   if (isCl) ntResp = await apireq("gradesGet", [clName, '', "a"]);
   else      ntResp = await apireq("interGroupGet", clName);
   if (ntResp == "none") {info(1, "Не могу получить список учащихся"); return;}
   let ntObj = JSON.parse(ntResp);

   // Формируем массивы фио детей и их логинов
   if (isCl) { // обычный класс
      pupLgnArr = ntObj.puList ? ntObj.puList : [];
      pupFioArr = ntObj.pnList;
   }
   else { // межклассная группа
      pupLgnArr = []; pupFioArr = [];
      for (let pup of ntObj) {
         pupLgnArr.push(pup[2]);
         pupFioArr.push(pup[0].replace(/(\S+) (.{1}).*/, "$1 $2."));
      }
   }
   
   // Формируем содержимое селекста выбора учащихся
   if (pupLgnArr.length) {
      let selPupilInner = `<option value="${clName}">ВСЕМ УЧАЩИМСЯ</option>`;
      for (let i=0; i<pupLgnArr.length; i++) selPupilInner +=
         `<option value="${pupLgnArr[i]}">${pupFioArr[i]}</option>`;
     
      dqs("#ntSelPupil").innerHTML = selPupilInner;
      inpFocus();
   }
   else {
      dqs("#ntSelPupil").innerHTML = '';
      info(0, "В этом классе (группе) нет учащихся!");
   }
}

// Формирование контента страницы
createSection("notes", `
   <div id="ntAddForm">
   <h3>Добавление новой заметки</h3>
   <select id="ntSelClass" onChange="ntPupListShow()"></select>
   <select id="ntSelPupil" onChange="inpFocus()"></select>
   <p>Введено <span>0</span> зн.; осталось <span>${NTVAL}</span> зн.</p>
   <textarea placeholder="Текст заметки (не более ${NTVAL} знаков)"
      maxlength="${NTVAL}" onKeyUp=ntCount()></textarea>
   <button type="button" onClick="ntAdd()">Сохранить</button>
   </div>
   
   <h3>Все заметки</h3><div id="ntResult"></div>
`);

// Динамически подгружаем контент страницы (имя метода = имени пункта меню!)
getContent.notes = async () => {
   
   let ntRole = dqs("#selRole").value,
       selClassInner = '';
       
   dqs("#ntAddForm").style.display  = "block";
   dqs("#ntAddForm textarea").value = '';
   ntCount();
   
   // Отключаем информацию о наличии новых заметок
   dqs("aside").style.display  = "none";
   
   // Если он учащийся или родитель, показываем заметки ему и классу/группам
   if (ntRole == "pupil" || ntRole == "parent") {
      dqs("#ntAddForm").style.display  = "none";
      ntShow(uLogin);
   }  
   else {      
      // Если он классный руководитель, показываем ему его классы
      if (ntRole == "tutor")
         for (let cl of uTutorCls) selClassInner += `<option>${cl}</option>`;
      
      // Если он администратор, показываем ему все классы
      // (межклассные группы не показываем, их слишком много)
      else if (ntRole == "admin") {
         let apiResp = await apireq("classesList");
         if (apiResp == "none") {info(1, "Не могу получить данные"); return;}
         let ntAllClasses = classSort(JSON.parse(apiResp));
         for (let cl of ntAllClasses)
            selClassInner += `<option>${cl}</option>`;
      }
      // Если он учитель, показываем ему все классы и группы его нагрузки
      else if (ntRole == "teacher") {
         let ntClasses = classSort(Object.keys(uTeachLoad));

         // Получаем список его межкласных групп
         let ntIntGroups = [];
         let apiResp = await apireq("interGroupList");
         if (apiResp != "none") for (let gr of JSON.parse(apiResp))
            if (gr[2] == uLogin) ntIntGroups.push(gr[0]);
         
         for (let cl of [...ntClasses, ...ntIntGroups])
            selClassInner += `<option>${cl}</option>`;
      }
      
      dqs("#ntSelClass").innerHTML = selClassInner;
      if (selClassInner) {
         ntPupListShow(); // показываем список учащихся этого класса или группы
         ntShow('');      // показываем все введенные им заметки
         inpFocus();      // фокус на поле ввода новой заметки
      }
      else {
         dqs("#ntAddForm").style.display  = "none";
         dqs("#ntResult").innerHTML = "<p>У вас нет доступных классов</p>";
      }
   }
};
