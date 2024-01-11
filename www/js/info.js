/**
 *   ЭЛЕКТРОННЫЙ ЖУРНАЛ «ШКАЛА»: ВЫДАЧА СООБЩЕНИЯ ВМЕСТО alert()
 *   Copyright © 2019, А.М.Гольдин. Modified BSD License
 */
"use strict";

elems.infoElem = document.createElement("output");
elems.infoElem.innerHTML =
   "<div></div><button type='button' onClick='info(2)'>OK</button>";
dqs("#content").appendChild(elems.infoElem);

// Выдача окна с сообщением
// Первый аргумент: 0 - информационное, 1 - ошибка, 2 - закрыть окно
// Второй аргумент: текст собщения
const info = (t, text) => {
   let out = dqs("output");
   let div = dqs("output div");
   
   if (t == 2) {
      out.style.display = "none";
      return;
   }
   
   if (!t) out.style.background = "#efe";
   else    out.style.background = "#fee";
   
   div.innerHTML = text;
   out.style.display = "block";
}
