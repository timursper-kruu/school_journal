/**
 *   ПОЛУЧЕНИЕ КОДОВ АВТОРИЗАЦИИ ДЛЯ РОДИТЕЛЕЙ ДАННОГО КЛАССА
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы - ["10Б", "ivanov"]
// Логин классного руководителя с фронтенда не передается,
// подписывается скриптом index.js
// Возвращает [["Иванов Иван", "ivanov", "123456"], ...] или "none"
module.exports = async (args) => {
   try {
      if (args.length != 2) return "none";
      let clName = args[0].substr(0,  3).trim(),
          lg     = args[1].substr(0, 20).trim();          

      if (!clName || !lg) return "none";
      if (!/^\d{1,2}[A-Я]{1}$/.test(clName)) return "none";
      
      let resp = [];
            
      // Проверяем полномочия классного руководителя на запрашиваемый класс
      let clRes = await dbFind("curric", {type: "class", className: clName});
      if (!clRes.length)        return "none";
      if (clRes[0].tutor != lg) return "none";
      
      // Идем циклом по всем ученикам данного класса
      let pupilsArr = await dbFind("pupils", {Uclass: clName});
      if (!pupilsArr.length) return "none";
      pupilsArr.sort((p1, p2) => p1.Ufamil.localeCompare(p2.Ufamil, "ru"));
      for (let pupil of pupilsArr) {
         if (pupil.block) continue;
         let code = captNumGen(pupil.Upwd).toString();
         resp.push([`${pupil.Ufamil} ${pupil.Uname}`, pupil.Ulogin, code]);
      }
      
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
