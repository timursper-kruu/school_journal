/**
 *   ДОБАВЛЕНИЕ ДОКУМЕНТА О ПРИЧИНЕ ПРОПУСКА УРОКОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы:
// [
//    "Записка от родителей",
//    "2019-09-02",
//    "2019-09-02",
//    "Болел",
//    "ivanov",
//    "petrov"
// ]
// Последний аргумент - логин классного руководителя
// (с фронтенда не передается, подписывается скриптом index.js)
// Возвращает "success" или "none"
module.exports = async (args) => {
   try {
      if (args.length != 6) return "none";
      let vid   = args[0].substr(0,  50).trim(),
          start = args[1].substr(0,  10).trim(),
          fin    = args[2].substr(0,  10).trim(),
          prim  = args[3].substr(0, 100).trim() || '',
          pupil = args[4].substr(0,  20).trim(),
          clruk = args[5].substr(0,  20).trim();

      if (!vid || !start || !fin || !pupil || !clruk) return "none";
      let dtPatt = /^\d{4}-\d{2}-\d{2}$/;
      if (!dtPatt.test(start) || !dtPatt.test(fin)) return "none";
      if (start > fin) return "none";
      prim = prim.replace(/[^а-яёА-ЯЁa-zA-Z0-9.,:\-!?№ ]/g, '');
      
      // Определяем класс ребенка
      let pupRes = await dbFind("pupils", {Ulogin: pupil});
      if (!pupRes.length) return "none";
      let pupClass = pupRes[0].Uclass;
            
      // Проверяем полномочия классного руководителя на запрашиваемый класс
      let clRes = await dbFind("curric", {type: "class", className: pupClass});
      if (!clRes.length)           return "none";
      if (clRes[0].tutor != clruk) return "none";
      
      // Пишем новый документ в базу
      await db.spravki.insert(
         {Uclass:pupClass, pupil:pupil, vid:vid, start:start, fin:fin, prim:prim}
      );
      
      return "success";
   }
   catch(e) {return "none";}
};
