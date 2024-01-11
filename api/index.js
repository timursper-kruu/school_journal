/**
 *   API ЭЛЕКТРОННОГО ЖУРНАЛА «ШКАЛА»
 *   Copyright © 2020, А.М.Гольдин. Modified BSD License
 */
"use strict";

// Подключение необходимых модулей API (модуль авторизации подключен отдельно)
// Имя модуля - ключ, а значения - это пара вида [0,1],
// где первое значение - требуется ли await при вызове модуля,
//     второе значение - передается ли модулю объект аргументов postDt.z
// Не забыть добавить функцию еще и в список логируемых функций (если нужно)
// в скрипте server.js, массив logFuncs
const modReq = {
   "classAdd":       [1,1], "classesList":    [1,0], "classDel":      [0,1],
   "interGroupEdit": [1,1], "interGroupList": [1,0], "interGroupDel": [0,1],
   "subjList":       [1,0], "subjAdd":        [1,1], "subjEdit":      [1,1],
   "subjDel":        [0,1], "usAddEdit":      [1,1], "usFind":        [1,1],
   "usFindLogin":    [1,1], "usImport":       [1,1], "usSetAdmin":    [1,1],
   "adminsList":     [1,0], "usBlock":        [1,1], "usChPwd":       [1,1],
   "teachList":      [1,0], "tutorSet":       [0,1], "tutorsList":    [1,0],
   "distrGet":       [1,0], "distrEdit":      [1,1], "classesGroups": [1,0],
   "topicEdit":      [1,1], "topicsGet":      [1,1], "gradesGet":     [1,1],
   "gradeAdd":       [1,1], "subgrEdit":      [1,1], "subgrPups":     [1,1],
   "parCodes":       [1,1], "jrnGet":         [1,1], "absentGet":     [1,1],
   "pupilsList":     [1,1], "sprAdd":         [1,1], "sprGet":        [1,1],
   "sprDel":         [1,1], "sprResp":        [1,1], "tabelGet":      [1,1],
   "export":         [1,1], "notesAdd":       [1,1], "notesGet":      [1,1],
   "notesDel":       [1,1], "logGet":         [1,1], "notesCheck":    [1,1],
   "statGet":        [1,1], "interGroupPup":  [1,1], "interGroupGet": [1,1],
   "attendGet":      [1,1], "electGet":       [1,1], "tabelGenAll":   [1,1]
};
let mod = {};
mod.auth = require("./auth");
for (let modName in modReq) mod[modName] = require("./" + modName);

// Полномочия (доступные модули) пользователей в зависимости от их роли
const RIGHTS = {
   "root":    [
      "classAdd", "classesList", "classDel", "subjList", "subjAdd", "subjEdit",
      "subjDel", "usAddEdit", "usFind", "usFindLogin", "usImport", "usSetAdmin",
      "adminsList", "usBlock"
   ],
   "admin":   [
      "classesList", "subjList", "teachList", "tutorSet", "tutorsList",
      "distrGet", "distrEdit", "classesGroups", "topicsGet", "gradesGet",
      "absentGet", "pupilsList", "sprResp", "export", "notesAdd", "notesGet",
      "notesDel", "logGet", "statGet", "interGroupEdit", "interGroupList",
      "interGroupDel", "attendGet", "tabelGet", "tabelGenAll"
   ],
   "teacher": [
      "usChPwd", "subjList", "topicEdit", "topicsGet", "gradesGet", "gradeAdd",
      "notesAdd", "notesGet", "notesDel", "interGroupList", "usFind",
      "interGroupPup", "interGroupGet", "attendGet", "sprResp"
   ],
   "tutor":   [
      "subjList", "distrGet", "teachList", "classesGroups", "topicsGet",
      "gradesGet", "subgrEdit", "subgrPups", "parCodes", "absentGet",
      "pupilsList", "sprAdd", "sprGet", "sprDel", "sprResp", "tabelGet",
      "export", "notesAdd", "notesGet", "notesDel", "logGet", "attendGet",
      "interGroupList", "electGet", "tabelGenAll"
   ],
   "pupil":   [
      "subjList", "teachList", "jrnGet", "absentGet", "sprGet", "sprResp",
      "tabelGet", "notesGet", "notesCheck"
   ],
   "parent":  [
      "subjList", "teachList", "jrnGet", "absentGet", "sprGet", "sprResp",
      "tabelGet", "notesGet", "notesCheck"
   ]
};
for (let item in RIGHTS) RIGHTS[item].push("login");

module.exports = async (post, addr) => {   
   
   // Разбираем переданные в аргументе POST-данные   
   let postDt = {};
   try {postDt = JSON.parse(post);} catch (e) {return "none";}   
   if (!postDt.t)  postDt.t  = "noType";
   if (!postDt.f)  postDt.f  = "noFunc";
   if (!postDt.l)  postDt.l  = "noLogin";
   if (!postDt.p)  postDt.p  = "noPassw";
   if (!postDt.ci) postDt.ci = "noCptId";
   if (!postDt.c)  postDt.c  = "noCapt";
   
   // Проверяем результаты аутентификации юзера
   let authResult = await mod.auth(
      postDt.t, postDt.l, postDt.p, postDt.ci, postDt.c, addr);
   if (!authResult) return "none";   
      
   // Проверяем полномочия юзера на запрашиваемую функцию   
   let rolesArr = JSON.parse(authResult)["roles"];
   if (!rolesArr.some(r => RIGHTS[r].includes(postDt.f))) return "none";
   
   // Подписываем логин юзера в массив аргументов, передающийся модулю API
   // (для некоторых функций API, требующих валидного логина юзера)
   let fNames = [
      "topicEdit", "gradeAdd", "subgrEdit", "subgrPups", "parCodes", "jrnGet",
      "absentGet", "sprAdd", "sprGet", "sprDel", "sprResp", "tabelGet",
      "export", "notesAdd", "notesGet", "notesDel", "logGet", "statGet",
      "interGroupPup", "attendGet", "electGet", "tabelGenAll"
   ];
   if (fNames.includes(postDt.f) && postDt.z) postDt.z.push(postDt.l);
      
   // Реализуем соответствующую функцию api в зависимости от переменной f
   // и необходимости использования await и передачи модулю аргументов
   if (postDt.f == "login") return authResult;
   if (!Object.keys(modReq).includes(postDt.f)) return "none";
   
   let argsObj = {};
   if (modReq[postDt.f][1]) {
      if (!postDt.z) return "none"; // аргументы модулю нужны, но они не пришли
      argsObj = postDt.z;
   }   
   
   if (modReq[postDt.f][0]) return (await mod[postDt.f](argsObj));
   else                     return mod[postDt.f](argsObj);
}
