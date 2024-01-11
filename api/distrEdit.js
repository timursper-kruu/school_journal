/**
 *   РЕДАКТИРОВАНИЕ ПЕДАГОГИЧЕСКОЙ НАГРУЗКИ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходит [func, teacher, subj, className]
// (func это 'add' или 'del'); возвращает success или none
// Нагрузка хранится в коллекции distrib в формате (одна запись - один учитель)
// {
//    tLogin: "pupkin",
//    tLoad:  {"s110": ["8Б", "10Ж"], "d830": ["8Б"]}
// }
module.exports = async argsObj => {   
   try {
      let func      = argsObj[0].trim(),
          teacher   = argsObj[1].substr(0, 50).trim(),
          subj      = argsObj[2].substr(0,  4).trim(),
          className = argsObj[3].substr(0, 20).trim();
      if (!func || !teacher || !subj || !className) return "none";      
      
      // Получаем нагрузку данного учителя по данному предмету (если есть)
      let teacherObj = {}, classesArr = [];
      let teachObjArr = await dbFind("distrib", {tLogin: teacher});
      if (teachObjArr.length) {
         teacherObj = teachObjArr[0].tLoad;
         if (teacherObj[subj]) classesArr = teacherObj[subj];
      }      
      
      // Добавление предмета и класса в нагрузку учителю
      if (func == "add") {
         if (classesArr.includes(className)) return "success";
         classesArr.push(className);
         teacherObj[subj] = classesArr;
         db["distrib"].update(
            {tLogin: teacher},
            {tLogin: teacher, tLoad: teacherObj},
            {upsert: true}
         );
         return "success";
      }
      
      // Удаление пары (предмет, класс) из нагрузки
      if (func == "del") {
         classesArr = classesArr.filter(c => c != className);
         if (classesArr.length) teacherObj[subj] = classesArr;
         else                   delete teacherObj[subj];
         
         if (!Object.keys(teacherObj).length) 
            db["distrib"].remove({tLogin: teacher}, {});
         else
            db["distrib"].update(
               {tLogin: teacher}, {tLogin: teacher, tLoad: teacherObj}, {});
         return "success";
      }
      
      return "none";
   }
   catch(e) {return "none";}
};
