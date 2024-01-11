/**
 *   ПОЛУЧЕНИЕ ДОКУМЕНТОВ О ПРИЧИНЕ ПРОПУСКА УРОКОВ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы - ["ivanov", "petrov"]
// Если документы запрашивает сам ученик, то первый аргумент "pupil", а второй
// аргумент - его логин. Если документы запрашивает классный руководитель,
// то первый аргумент - логин ученика, второй - логин классного руководителя.
// Второй аргумент в любом случае с фронтенда не передается, подписывается
// скриптом index.js.
// Возвращает "none" или массив объектов вида
// {
//    pupil: "ivanov",
//    vid:   "med",
//    start: "2019-09-03",
//    fin:    "2019-09-05",
//    prim:  "Болел живот",
//    id:    "gjRhgc"
// }
module.exports = async (args) => {
   try {
      if (args.length != 2) return "none";
      let pupil = '';
      
      if (args[0] == "pupil") { // документы запрашиваются самим учеником
         pupil = args[1].substr(0, 20).trim();
         if (!pupil) return "none";
      }
      else { // документы запрашиваются классным руководителем
         pupil = args[0].substr(0, 20).trim();
         let clruk = args[1].substr(0, 20).trim();
         if (!pupil || !clruk) return "none";
         
         // Определяем класс ребенка
         let pupRes = await dbFind("pupils", {Ulogin: pupil});
         if (!pupRes.length) return "none";
         let pupClass = pupRes[0].Uclass;
               
         // Проверяем полномочия классного руководителя на запрашиваемый класс
         let clRes = await dbFind("curric", {type: "class", className: pupClass});
         if (!clRes.length)           return "none";
         if (clRes[0].tutor != clruk) return "none";
      }     
      
      // Читаем документы из базы и отдаем
      let resp = await dbFind("spravki", {pupil: pupil});
      resp.sort((a, b) => a.fin > b.fin);
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
