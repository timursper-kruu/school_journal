/**
 *   ДОБАВЛЕНИЕ ИЛИ УДАЛЕНИЕ ПОДГРУППЫ КЛАССА В КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы типа ["10Б", "10Б-мальч", "add", "ivanov"] (или "del")
// Фамилия классного руководителя с фронтенда не передается,
// подписывается скриптом index.js
// Возвращает "success" или "none"
module.exports = async (args) => {
   try {
      if (args.length != 4) return "none";
      if (args[2] != "add" && args[2] != "del") return "none";
      let clName = args[0].substr(0,  3).trim(),
          grName = args[1].substr(0, 20).trim(),
          lg     = args[3].substr(0, 20).trim();          

      if (!clName || !grName) return "none";
      if (!/^\d{1,2}[A-Я]{1}$/.test(clName)) return "none";
      if (!/^\d{1,2}[A-Я]{1}-[а-яё0-9]{1,10}$/.test(grName)) return "none";
      
      let clRes = await dbFind("curric", {type: "class", className: clName});
      if (!clRes.length) return "none";
      
      let clObj = clRes[0]; // объект запрашиваемого класса
      let gr = clObj.groups;
      
      // Проверяем полномочия классного руководителя на запрашиваемый класс
      if (clObj.tutor != lg) return "none";
      
      // Добавление подгруппы
      if (args[2] == "add") {
         if (!gr.includes(grName)) {
            gr.push(grName);
            clObj.groups = gr;
            await db["curric"].update(
               {type: "class", className: clName}, clObj, {}
            );
         }
      }
      
      // Удаление подгруппы
      else {
         let ind = gr.indexOf(grName);
         if (ind > -1) {            
            // Удаляем собственно подгруппу
            gr.splice(ind, 1);
            clObj.groups = gr;
            await db["curric"].update(
               {type: "class", className: clName}, clObj, {}
            );
            
            // Удаляем эту подгруппу у всех учеников, которые в нее входили
            // (идем циклом по всем ученикам данного класса)
            let pupilsArr = await dbFind("pupils", {Uclass: clName});
            if (!pupilsArr.length) return "success";
            for (let pupil of pupilsArr) {
               if (pupil.groups) if (pupil.groups.includes(grName)) {
                  pupil.groups.splice(pupil.groups.indexOf(grName), 1);
                  await db["pupils"].update({Ulogin: pupil.Ulogin}, pupil, {});
               }
            }
         }
      }
      
      return "success";
   }
   catch(e) {return "none";}
};
