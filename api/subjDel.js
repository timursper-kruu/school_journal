/**
 *   УДАЛЕНИЕ ДОПОЛНИТЕЛЬНОГО ПРЕДМЕТА ИЗ КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success" или "none"
module.exports = sbDelKey => {
   try {
      db.curric.remove({type: "subj", sbKod: sbDelKey}, {});
      return "success";
   }
   catch(e) {return "none";}
};
