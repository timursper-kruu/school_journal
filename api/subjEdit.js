/**
 *   РЕДАКТИРОВАНИЕ НАЗВАНИЯ ДОПОЛНИТЕЛЬНОГО ПРЕДМЕТА В КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success" либо "none"
module.exports = async newSubj => {
   try {
      // Проверяем, что пришло
      const newSubjKey  = newSubj[0].trim() || 'a',
            newSubjName = newSubj[1].trim() || 'a',
            reSubjKey   = /^[ds]{1}\d{3}$/,
            reSubjName  = /^[A-Za-z0-9А-Яа-яЁё(). \-]{2,30}$/;
      if (!reSubjKey.test(newSubjKey) || !reSubjName.test(newSubjName))
         return "none";
   
      // Проверяем, есть ли такой предмет в коллекции;
      // если есть - редактируем, если нет - возвращаем ошибку
      let res = await dbFind("curric", {type: "subj", sbKod: newSubjKey});
      if (res.length) {      
         db.curric.update(
            {type: "subj", sbKod: newSubjKey},
            {type: "subj", sbKod: newSubjKey, sbName: newSubjName}, {}
         );
         return "success";
      }
      else return "none";
   }
   catch(e) {return "none";}
};
