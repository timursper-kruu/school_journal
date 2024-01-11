/**
 *   ВЫДАЧА ДАННЫХ ДЛЯ ФОРМИРОВАНИЯ ТАБЕЛЯ ИТОГОВЫХ ОТМЕТОК
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В аргументах приходит массив типа ["ivanov", "petrov"],
// где ivanov - логин ученика, чьи отметки запрашиваются,
//     petrov - логин юзера, который запрашивает эти отметки
// (логин юзера с фронтенда не передается, подписывается скриптом index.js).
// Возвращает none или объект с итоговыми отметками по предметам
// {
//    "s410": {d628a: "5", d831b: "0", ...}
//    ...
// }
// Если предмет равен "s000" (внеурочная деятельность), вместо "s000" ключом
// будет "23Б" (имя группы внеурочной деятельности)
module.exports = async (argArr) => {
   let resp = {};
   try {
      // Логины учащегося и запрашивающего юзера
      if (argArr.length != 2) return "none";
      let pupil = argArr[0].substr(0, 20).trim(),
          user  = argArr[1].substr(0, 20).trim(),
          patt  = /^[a-z0-9]+$/;
      if (!patt.test(pupil) || !patt.test(user)) return "none";
      
      // Администратор ли он?
      let admRes = await dbFind("staff", {Ulogin: user});
      if (!admRes.length) admRes = [{}];
      
      // Проверяем полномочия юзера на запрос отметок этого ученика
      if (pupil != user && !admRes[0].admin) {
         
         // Определяем класс ребенка
         let pupRes = await dbFind("pupils", {Ulogin: pupil});
         if (!pupRes.length) return "none";
         let pupClass = pupRes[0].Uclass;
               
         // Проверяем полномочия классного руководителя на запрашиваемый класс
         let clRes = await dbFind("curric", {type: "class", className: pupClass});
         if (!clRes.length)          return "none";
         if (clRes[0].tutor != user) return "none";
      }
      
      // Получаем итоговые отметки и подписываем их в объект resp
      // (для внеурочной деятельности имя предмета заменяем на имя группы)
      let res = await dbFind("grades", {p: pupil, d: RegExp("\\w{5}")});
      for (let otm of res) 
         if (otm.g) {
            let subj = otm.s;
            if (subj == "s000") subj = otm.c;
            if (!resp[subj]) resp[subj] = {};
            resp[subj][otm.d] = otm.g;
         }
      
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
