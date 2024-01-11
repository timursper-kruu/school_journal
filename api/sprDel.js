/**
 *   УДАЛЕНИЕ ДОКУМЕНТА О ПРИЧИНЕ ПРОПУСКА УРОКОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы: ["hgjThg", "ivanov"] (id справки и логин классного руководителя;
// логин с фронтенда не передается, подписывается скриптом index.js)
// Возвращает "success" или "none"
module.exports = async (args) => {
   try {
      if (args.length != 2) return "none";
      let id    = args[0].substr(0, 50).trim(),
          clruk = args[1].substr(0, 20).trim();

      if (!id || !clruk) return "none";
      
      // Определяем наличие такой справки и класс ребенка
      let sprRes = await dbFind("spravki", {_id: id});
      if (!sprRes.length) return "none";
      let pupil = sprRes[0].pupil;
      
      let pupRes = await dbFind("pupils", {Ulogin: pupil});
      if (!pupRes.length) return "none";
      let pupClass = pupRes[0].Uclass;
            
      // Проверяем полномочия классного руководителя на запрашиваемый класс
      let clRes = await dbFind("curric", {type: "class", className: pupClass});
      if (!clRes.length)           return "none";
      if (clRes[0].tutor != clruk) return "none";
      
      // Удаляем справку
      await db.spravki.remove({_id: id}, {});
      
      return "success";
   }
   catch(e) {return "none";}
};
