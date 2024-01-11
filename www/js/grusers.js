/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: РЕДАКТИРОВАНИE СОСТАВА МЕЖКЛАССНЫХ ГРУПП
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";
// Массив групп данного учителя: [["23Б", "Химия"], ...]
let grusList = [];

// Показ выбранной учителем группы
const grusShow = async grName => {

   // Очищаем блок добавления нового ученика
   dqs("#grusDatalist").innerHTML = '';
   dqs("#grusDatalist").style.display = "none";
   dqs("#grusFindPup").value = '';

   // Получаем список группы и публикуем с иконками удаления учащихся
   let apiResp = await apireq("interGroupGet", grName);
   if (apiResp == "none") {info(1, "Ошибка на сервере"); return;}

   let pupArr = JSON.parse(apiResp);
   let listInner = pupArr.length ?
                   `<p>Список группы ${grName}</p>` :
                   `<p>В группе ${grName} нет учащихся</p>`;
   let i=1;
   for (let pup of pupArr) {
      listInner += `<div>
      <span onClick="grusPupDel('${pup[2]}')" title="Удалить">&#10060;</span>
      <span>${i}.&nbsp;</span>${pup[0]} (${pup[1]})</div>`;
      i++;
   }
   dqs("#grusPupList").innerHTML = listInner;
}

// Удаление ученика из группы
const grusPupDel = async pupLgn => {
   let grName = dqs("#grusSelGr").value;
   if (!confirm("Вы уверены?")) return;
   let apiResp = await apireq("interGroupPup", ["del", grName, pupLgn]);
   if (apiResp == "none") {
      info(1, "Ошибка на сервере.<br>Учащийся не удален");
      return;
   }
   grusShow(grName);
}

// Добавление ученика в группу
const grusPupAdd = async pupLgn => {
   let grName = dqs("#grusSelGr").value;
   dqs("#grusDatalist").innerHTML = '';
   dqs("#grusDatalist").style.display = "none";
   dqs("#grusFindPup").value = '';

   let apiResp = await apireq("interGroupPup", ["add", grName, pupLgn]);
   if (apiResp == "none") {
      info(1, "Ошибка на сервере.<br>Учащийся не добавлен");
      return;
   }
   grusShow(grName);
   dqs("#grusFindPup").focus();
}

// Подгрузка datalist в блоке выбора ученика для добавления
const grusDataGet = async fragm => {
   dqs("#grusDatalist").innerHTML = '';
   dqs("#grusDatalist").style.display = "none";   

   if (!dqs("#grusSelGr").value) {info(1, "Сначала выберите группу"); return;}

   if (fragm.length < 3) return;
   fragm = fragm.trim();

   let dtListInner = '';
   let apiResp = await apireq("usFind", ["Учащийся", '0', fragm]);
   if (apiResp != "none") {
      let deti = JSON.parse(apiResp);
      deti.filter(p => !p.block).map(p => {
         dtListInner += `<button type="button" `
                      + `onclick="grusPupAdd('${p.login}')">`
                      + `${p.famil} ${p.name} (${p.unit})</button>`;
      });
      if (dtListInner) {
         dqs("#grusDatalist").innerHTML = dtListInner;
         dqs("#grusDatalist").style.display = "block";
      }
   }
}

// Формирование контента странички
createSection("grusers", `
   <h3>Редактирование состава групп внеурочной деятельности</h3>
   <select id="grusSelGr" onChange="grusShow(this.value)"></select>
   <div id="grusPupList"></div>
   <h3>Добавить учащегося в группу</h3>
   <input type="text" id="grusFindPup" placeholder="Начните вводить фамилию"
          onKeyUp="grusDataGet(this.value)">
   <div id="grusDatalist"></div>
`);

// Динамически подгружаем список групп данного учителя в массив grusList
// и публикуем его на страничке (имя метода = имени пункта меню!)
// uLogin из замыкания (определен в login.js)
getContent.grusers = async () => {
   let selInner = "<option value=''>== ВЫБЕРИТЕ ГРУППУ ==</option>";
   
   let apiResp = await apireq("interGroupList");
   grusList = JSON.parse(apiResp)
            . filter(x => x[2] == uLogin).map(x => [x[0], x[1]]);
   
   if (grusList.length) {
      grusList.sort((a, b) => a[0].localeCompare(b[0], "ru"));   
      for (let g of grusList) {
         let grTitle = g[1].length > 30 ? g[1].substr(0, 30) + "..." : g[1];
         selInner += `<option value="${g[0]}">${g[0]}: ${grTitle}</option>`;
      }
   }
   else selInner =
      "<option value=''>У вас нет групп внеурочной деятельности</option>";

   dqs("#grusSelGr").innerHTML = selInner;      
}
