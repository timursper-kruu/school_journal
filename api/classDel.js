/**
 *   УДАЛЕНИЕ КЛАССА ИЗ СПИСКА В КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success" или "none"
module.exports = clDelName => {
   try {
      db.curric.remove({type: "class", className: clDelName}, {});
      return "success";
   }
   catch(e) {return "none";}
};
