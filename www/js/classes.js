/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: БЛОК РЕДАКТИРОВАНИЯ СПИСКА КЛАССОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Массив названий классов
let classesList = [];

// Публикация списка классов на страничке из массива clArr
const clListPubl = clArr => {
   if (!clArr.length) {
      dqs("#clList").innerHTML = "Классов не найдено.";
      return;
   }
   // Сначала сортируем массив классов правильным образом,
   // затем публикуем с иконками удаления
   let massiv = classSort(clArr); // определена в ini.js
   let cont = '',
       currNum = Number(massiv[0].substr(0, massiv[0].length - 1));
   for (let currCl of massiv) {            
      let num = Number(currCl.substr(0, currCl.length - 1));
      if (num != currNum) {
         currNum = num;
         cont += "<br>";
      }
      cont += `<span>
         <div onclick="classNumDel('${currCl}')">&#10060;</div>${currCl}</span>`;
   }
   dqs("#clList").innerHTML = cont;  
};

// Отправка запроса к API для добавления класса
const classAdd = async () => {
   let newClassName = dqs("#addClassNum").value.toString()
                    + dqs("#addClassLit").value;
   dqs("#addClassNum").value = '1';
   dqs("#addClassLit").value = 'А';
   let apiResp = await apireq("classAdd", newClassName);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      classesList.push(newClassName);
      clListPubl(classesList);
   }
};

// Удаление класса
const classNumDel = async (clNum) => {
   if (!confirm("Вы уверены?")) return;
   let apiResp = await apireq("classDel", clNum);
   if (apiResp == "none") info(1, "Запрашиваемая операция отклонена.");
   else {
      let clIndex = classesList.indexOf(clNum);
      if (clIndex > -1) classesList.splice(clIndex, 1);
      clListPubl(classesList);
   }
}

// Формирование контента странички
createSection("classes", `
   <h3>Список классов</h3>
   <div id="clList"></div><br>
   <select id="addClassNum"></select>
   <select id="addClassLit"></select>
   <button type="button" onclick="classAdd()">Добавить</button>
`);

// Формирование опций селектов для добавления класса
let clNumOpt = '', clLitOpt = '', clLiters = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ";
for (let i = 1; i < 12; i++)
   clNumOpt += `<option>${i}</option>`;
for (let i = 0; i < clLiters.length; i++)
   clLitOpt += `<option>${clLiters.charAt(i)}</option>`;
dqs("#addClassNum").innerHTML = clNumOpt;
dqs("#addClassLit").innerHTML = clLitOpt;

// Динамически подгружаем список классов в массив classesList
// с помощью API и публикуем его на страничке (имя метода = имени пункта меню!)
getContent.classes = async () => {
   let apiResp = await apireq("classesList");
   if (apiResp != "none") classesList = JSON.parse(apiResp);
   clListPubl(classesList);
}
