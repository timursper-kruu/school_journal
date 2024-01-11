/**
 *   УДАЛЕНИЕ МЕЖКЛАССНОЙ ГРУППЫ ИЗ СПИСКА В КОЛЛЕКЦИИ CURRIC
 *   Copyright © 2021, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Возвращает "success" или "none"
module.exports = grDelName => {
   try {
      // Удаляем саму группу
      db.curric.remove({type: "intergroup", ingrName: grDelName}, {});

      // Удаляем все темы занятий
      db.topics.remove({g: grDelName}, {multi: true});

      // Удаляем все отметки
      db.grades.remove({c: grDelName}, {multi: true});

      return "success";
   }
   catch(e) {return "none";}
};
