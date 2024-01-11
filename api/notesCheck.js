/**
 *   ПРОВЕРКА НАЛИЧИЯ НОВЫХ ЗАМЕТОК ДЛЯ УЧАЩЕГОСЯ ИЛИ РОДИТЕЛЯ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходят ["ivanov", "pupil"]
//    ivanov - это логин юзера
//    pupil  - это роль юзера (может быть также "par")
// 
// Возвращается success или none

const ntsGet = require("./notesGet");

module.exports = async (args) => {
   try {
      if (args.length != 2) return "none";
      let lg   = args[0].substr(0, 20).trim(),
          role = args[1].substr(0,  5);

      if (!lg || (role != "pupil" && role != "par")) return "none";
      
      // Получаем дату и время предпоследней авторизации юзера      
      let resp = await dbFind("authlog", {l:lg, c:role});
      if (!resp.length) return "none";
      resp.sort((a,b) => a.d <= b.d ? 1 : -1);
      let lastAuth = "1970-01-01 10:00:00";
      if (resp[1]) lastAuth = resp[1].d;
      
      // Получаем дату и время последней предназначенной юзеру заметки
      let notes = await ntsGet([lg, lg]);
      if (notes == "none") return "none";
      let notesArr = JSON.parse(notes);
      if (!notesArr.length) return "none";
      let lastNote = notesArr[0].dt;
      
      // Если предпоследняя авторизация была раньше, чем последняя заметка,
      // юзера надо известить о наличии свежих заметок
      let itog = (lastAuth < lastNote) ? "success" : "none";
      
      return itog;
   }
   catch(e) {return "none";}
};
