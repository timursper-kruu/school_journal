/**
 *   ПОЛУЧЕНИЕ ЗАМЕТОК ДЛЯ УЧЕНИКА ИЛИ ЗАМЕТОК, ОПУБЛИКОВАННЫХ СОТРУДНИКОМ
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Аргументы - ["ivanov", "petrov"]
// Первый аргумент - логин ученика
// (или '', если запрашиваются все заметки, опубликованные сотрудником)
// Второй аргумент - логин автора запроса
// (с фронтенда не передается, подписывается скриптом index.js)
// Возвращает "none" или массив объектов вида (упорядочен по датам)
// {
//    _id:"Wo58", dt:"2020-01-28",
//    r: "ivanov", rf:"Иванов В. (8Б)",
//    t: "Ура!",
//    a: "petrov", af:"Петров И. И."
// }
module.exports = async (args) => {
   try {
      if (args.length != 2) return "none";
      let pupil = args[0].substr(0,  20).trim(),
          user  = args[1].substr(0,  20).trim();
          
      let request = {a:user};
      let names = [pupil]; // класс ученика, его группы и логин (для поиска) 
      
      if (pupil) { // заметки запрашиваются учеником или родителем
         if (pupil != user) return "none";
         
         // Определяем его класс и группы (в том числе межклассные)
         let res = await dbFind("pupils", {Ulogin: pupil});
         if (!res.length) return "none";
         names.push(res[0].Uclass);
         if (res[0].groups) names.push(...(res[0].groups));
         if (res[0].facult) names.push(...(res[0].facult));                  
         request = {$where: function() {return names.includes(this.r);}}
      }
            
      // Читаем документы из базы и отдаем
      let resp = await dbFind("notes", request);
      resp.sort((a, b) => (a.dt <= b.dt) ? 1 : -1);
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
