/**
 *   ДОБАВЛЕНИЕ НОМЕРА КЛАССА В КОЛЛЕКЦИЮ CURRIC
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success" либо "none"
module.exports = async newClassName => {
   try {
      // Проверяем формат пришедшего имени класса
      const reClassName = /^\d{1,2}[A-Я]{1}$/;
      if (!reClassName.test(newClassName)) return "none";
   
      // Проверяем, нет ли уже такого класса в списке,
      // если нет - добавляем, если есть - возвращаем ошибку
      let res = await dbFind("curric", {type: "class", className: newClassName});
      if (res.length) return "none";
      else {
         let subNames = ["мальч", "дев", "иняз1", "иняз2", "инф1", "инф2"]
                      . map(x => newClassName + '-' + x);
         db.curric.insert(
            {type: "class", className: newClassName, groups: subNames});
         return "success";
      }
   }
   catch(e) {return "none";}
};
