/**
 *   ВЫДАЧА ДАННЫХ ОБ ВНЕУРОЧНОЙ ДЕЯТЕЛЬНОСТИ ОДНОГО УЧАЩЕГОСЯ
 *   Copyright © 2021, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В аргументах приходит массив типа ["ivanov", "petrov"],
// где ivanov - логин ученика, чьи данные запрашиваются,
//     petrov - логин юзера, который запрашивает эти данные
// (логин юзера с фронтенда не передается, подписывается скриптом index.js).
// Возвращает none или объект с итоговыми отметками по группам внеур. деят.:
// {
//    "23Б": {d628: "нн5", d831b: "4", ...}
//    ...
// }
// Если ребенок является членом группы, но отметок нет, выдается что-то типа
// {
//    "23Б": {}
//    ...
// }

module.exports = async (argArr) => {
   let resp = {};
   try {
      // Логины учащегося и запрашивающего юзера
      if (argArr.length != 2) return "none";
      let pupil = argArr[0].substr(0, 20).trim(),
          user  = argArr[1].substr(0, 20).trim(),
          patt  = /^[a-z0-9]+$/;
      if (!patt.test(pupil) || !patt.test(user)) return "none";
      
      // Определяем класс ребенка
      let pupRes = await dbFind("pupils", {Ulogin: pupil});
      if (!pupRes.length) return "none";
      let pupClass = pupRes[0].Uclass;

      // Массив групп, в которых состоит ребенок
      let grList = pupRes[0].facult || [];
            
      // Проверяем полномочия классного руководителя на запрашиваемый класс
      let clRes = await dbFind("curric", {type: "class", className: pupClass});
      if (!clRes.length)          return "none";
      if (clRes[0].tutor != user) return "none";

      // Получаем отметки
      for (let gr of grList) {         
         resp[gr] = {};
         let grRes = await dbFind("grades", {c: gr, p: pupil});
         grRes.sort((a,b) => a.d > b.d ? 1 : -1);
         for (let grade of grRes) resp[gr][grade.d] = grade.g; 
      }
      
      return JSON.stringify(resp);
   }
   catch(e) {return "none";}
};
