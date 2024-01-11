/**
 *   НАЗНАЧЕНИЕ КЛАССУ КЛАССНОГО РУКОВОДИТЕЛЯ
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

// В запросе приходит ["8Б", "pupkin"]; возвращает "success" или "none"
module.exports = newTutor => {   
   try {
      let clName = newTutor[0].trim(), login = newTutor[1].trim();
      if (!clName || !login) return "none";
      
      db["curric"].update(
         {type: "class", className: clName},
         {$set: {tutor: login}}, {}
      );      
      return "success";
   }
   catch(e) {return "none";}
};
