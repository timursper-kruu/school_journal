// Использование этого модуля - см. строку 349
"use strict";

/**
 * A handy class to calculate color values
 * © 2013, Robert Eisele robert@xarg.org
 * Modified 2013, by George Chan gchan@21cn.com
 * Modified 2019, Александр Гольдин a@goldin.su
 * http://www.opensource.org/licenses/bsd-license.php BSD License
 */
function pnglib(width, height, depth) {
   
   function write(buffer, offs) {
      for (let i = 2; i < arguments.length; i++) {
         for (let j = 0; j < arguments[i].length; j++) {
            buffer[offs++] = arguments[i].charAt(j);
         }
      }
   }
   function byte2(w) {
      return String.fromCharCode((w >> 8) & 255, w & 255);
   }
   function byte4(w) {
      return String.fromCharCode((w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w & 255);
   }
   function byte2lsb(w) {
      return String.fromCharCode(w & 255, (w >> 8) & 255);
   }

   this.width   = width;
   this.height  = height;
   this.depth   = depth;

   this.pix_size = height * (width + 1);

   this.data_size = 2 + this.pix_size + 5 * Math.floor((0xfffe + this.pix_size) / 0xffff) + 4;

   this.ihdr_offs = 0;
   this.ihdr_size = 4 + 4 + 13 + 4;
   this.plte_offs = this.ihdr_offs + this.ihdr_size;
   this.plte_size = 4 + 4 + 3 * depth + 4;
   this.trns_offs = this.plte_offs + this.plte_size;
   this.trns_size = 4 + 4 + depth + 4;
   this.idat_offs = this.trns_offs + this.trns_size;
   this.idat_size = 4 + 4 + this.data_size + 4;
   this.iend_offs = this.idat_offs + this.idat_size;
   this.iend_size = 4 + 4 + 4;
   this.buffer_size  = this.iend_offs + this.iend_size;

   this.buffer  = new Array();
   this.palette = new Object();
   this.pindex  = 0;

   let _crc32 = new Array();

   for (let i = 0; i < this.buffer_size; i++) {
      this.buffer[i] = "\x00";
   }
   
   write(this.buffer, this.ihdr_offs, byte4(this.ihdr_size - 12), 'IHDR', byte4(width), byte4(height), "\x08\x03");
   write(this.buffer, this.plte_offs, byte4(this.plte_size - 12), 'PLTE');
   write(this.buffer, this.trns_offs, byte4(this.trns_size - 12), 'tRNS');
   write(this.buffer, this.idat_offs, byte4(this.idat_size - 12), 'IDAT');
   write(this.buffer, this.iend_offs, byte4(this.iend_size - 12), 'IEND');

   let header = ((8 + (7 << 4)) << 8) | (3 << 6);
   header+= 31 - (header % 31);

   write(this.buffer, this.idat_offs + 8, byte2(header));

   for (let i = 0; (i << 16) - 1 < this.pix_size; i++) {
      let size, bits;
      if (i + 0xffff < this.pix_size) {
         size = 0xffff;
         bits = "\x00";
      } else {
         size = this.pix_size - (i << 16) - i;
         bits = "\x01";
      }
      write(this.buffer, this.idat_offs + 8 + 2 + (i << 16) + (i << 2), bits, byte2lsb(size), byte2lsb(~size));
   }

   for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
         if (c & 1) {
            c = -306674912 ^ ((c >> 1) & 0x7fffffff);
         } else {
            c = (c >> 1) & 0x7fffffff;
         }
      }
      _crc32[i] = c;
   }

   this.index = function(x,y) {
      let i = y * (this.width + 1) + x + 1;
      let j = this.idat_offs + 8 + 2 + 5 * Math.floor((i / 0xffff) + 1) + i;
      return j;
   }

   this.color = function(red, green, blue, alpha) {

      alpha = alpha >= 0 ? alpha : 255;
      let color = (((((alpha << 8) | red) << 8) | green) << 8) | blue;

      if (typeof this.palette[color] == "undefined") {
         if (this.pindex == this.depth) return "\x00";

         let ndx = this.plte_offs + 8 + 3 * this.pindex;

         this.buffer[ndx + 0] = String.fromCharCode(red);
         this.buffer[ndx + 1] = String.fromCharCode(green);
         this.buffer[ndx + 2] = String.fromCharCode(blue);
         this.buffer[this.trns_offs+8+this.pindex] = String.fromCharCode(alpha);

         this.palette[color] = String.fromCharCode(this.pindex++);
      }
      return this.palette[color];
   }

   this.getBase64 = function() {

      let s = this.getDump();

      let ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let c1, c2, c3, e1, e2, e3, e4;
      let l = s.length;
      let i = 0;
      let r = "";

      do {
         c1 = s.charCodeAt(i);
         e1 = c1 >> 2;
         c2 = s.charCodeAt(i+1);
         e2 = ((c1 & 3) << 4) | (c2 >> 4);
         c3 = s.charCodeAt(i+2);
         if (l < i+2) { e3 = 64; } else { e3 = ((c2 & 0xf) << 2) | (c3 >> 6); }
         if (l < i+3) { e4 = 64; } else { e4 = c3 & 0x3f; }
         r+= ch.charAt(e1) + ch.charAt(e2) + ch.charAt(e3) + ch.charAt(e4);
      } while ((i+= 3) < l);
      return r;
   }

   this.getDump = function() {

      let BASE = 65521;
      let NMAX = 5552;
      let s1 = 1;
      let s2 = 0;
      let n = NMAX;

      for (let y = 0; y < this.height; y++) {
         for (let x = -1; x < this.width; x++) {
            s1+= this.buffer[this.index(x, y)].charCodeAt(0);
            s2+= s1;
            if ((n-= 1) == 0) {
               s1%= BASE;
               s2%= BASE;
               n = NMAX;
            }
         }
      }
      s1%= BASE;
      s2%= BASE;
      write(this.buffer, this.idat_offs + this.idat_size - 8, byte4((s2 << 16) | s1));

      function crc32(png, offs, size) {
         let crc = -1;
         for (let i = 4; i < size-4; i += 1) {
            crc = _crc32[(crc ^ png[offs+i].charCodeAt(0)) & 0xff] ^ ((crc >> 8) & 0x00ffffff);
         }
         write(png, offs+size-4, byte4(crc ^ -1));
      }

      crc32(this.buffer, this.ihdr_offs, this.ihdr_size);
      crc32(this.buffer, this.plte_offs, this.plte_size);
      crc32(this.buffer, this.trns_offs, this.trns_size);
      crc32(this.buffer, this.idat_offs, this.idat_size);
      crc32(this.buffer, this.iend_offs, this.iend_size);

      return "\u0089PNG\r\n\u001A\n"+this.buffer.join('');
   }
};

/**
 * Captcha PNG generator
 * © 2013, George Chan gchan@21cn.com
 * Modified 2019, Александр Гольдин a@goldin.su
 * http://www.opensource.org/licenses/bsd-license.php BSD License
 */

this.numMask = [];
this.numMask[0]=[];
this.numMask[0]=loadNumMask0();
this.numMask[1]=loadNumMask1();
let myself = this;

function loadNumMask0() {
   let numbmp=[];
   numbmp[0]=[
      "0011111000", "0111111110", "0111111110", "1110001111", "1110001111",
      "1110001111", "1110001111", "1110001111", "1110001111", "1110001111",
      "1110001111", "1110001111", "1110001111", "1110001111", "1110001111",
      "1110001111", "0111111111", " 111111110", "0011111100"];
   numbmp[1]=[
      "0000011", "0000111", "0011111", "1111111", "1111111", "0001111",
      "0001111", "0001111", "0001111", "0001111", "0001111", "0001111",
      "0001111", "0001111", "0001111", "0001111", "0001111", "0001111",
      "0001111"];
   numbmp[2]=[
      "001111100", "011111110", "111111111", "111001111", "111001111",
      "111001111", "111001111", "000011111", "000011110", "000111110",
      "000111100", "000111100", "001111000", "001111000", "011110000",
      "011110000", "111111111", "111111111", "111111111"];
   numbmp[3]=[
      "0011111100", "0111111110", "1111111111", "1111001111", "1111001111",
      "1111001111", "0000001111", "0001111110", "0001111100", "0001111111",
      "0000001111", "1111001111", "1111001111", "1111001111", "1111001111",
      "1111001111", "1111111111", "0111111110", "0011111100"];
   numbmp[4]=[
      "00001111110", "00001111110", "00011111110", "00011111110", "00011111110",
      "00111011110", "00111011110", "00111011110", "01110011110", "01110011110",
      "01110011110", "11100011110", "11111111111", "11111111111", "11111111111",
      "11111111111", "00000011110", "00000011110", "00000011110"];
   numbmp[5]=[
      "1111111111", "1111111111", "1111111111", "1111000000", "1111000000",
      "1111011100", "1111111110", "1111111111", "1111001111", "1111001111",
      "0000001111", "0000001111", "1111001111", "1111001111", "1111001111",
      "1111001111", "1111111111", "0111111110", "0011111100"];
   numbmp[6]=[
      "0011111100", "0111111110", "0111111111", "1111001111", "1111001111",
      "1111000000", "1111011100", "1111111110", "1111111111", "1111001111",
      "1111001111", "1111001111", "1111001111", "1111001111", "1111001111",
      "1111001111", "0111111111", "0111111110", "0011111100"];
   numbmp[7]=[
      "11111111", "11111111", "11111111", "00001111", "00001111", "00001111",
      "00001110", "00001110", "00011110", "00011110", "00011110", "00011100",
      "00111100", "00111100", "00111100", "00111100", "00111000", "01111000",
      "01111000"];
   numbmp[8]=[
      "0011111100", "0111111110", "1111111111", "1111001111", "1111001111",
      "1111001111", "1111001111", "0111111110", "0011111100", "0111111110",
      "1111001111", "1111001111", "1111001111", "1111001111", "1111001111",
      "1111001111", "1111111111", "0111111110", "0011111100"];
   numbmp[9]=[
      "0011111100", "0111111110", "1111111111", "1111001111", "1111001111",
      "1111001111", "1111001111", "1111001111", "1111001111", "1111001111",
      "1111111111", "0111111111", "0011101111", "0000001111", "1111001111",
      "1111001111", "1111111110", "0111111110", "0011111000"];
   return numbmp;
}

function loadNumMask1() {
   let numbmp=[];
   numbmp[0] = [
      "000000001111000", "000000111111110", "000001110000110", "000011000000011",
      "000110000000011", "001100000000011", "011100000000011", "011000000000011",
      "111000000000110", "110000000000110", "110000000001110", "110000000001100",
      "110000000011000", "110000000111000", "011000011110000", "011111111000000",
      "000111110000000"];
   numbmp[1] = [
      "00000111", "00001111", "00011110", "00010110", "00001100", "00001100",
      "00011000", "00011000", "00110000", "00110000", "00110000", "01100000",
      "01100000", "01100000", "11000000", "11000000", "11000000"];
   numbmp[2] = [
      "00000011111000", "00001111111110", "00011100000110", "00011000000011",
      "00000000000011", "00000000000011", "00000000000011", "00000000000110",
      "00000000001110", "00000000011100", "00000001110000", "00000111100000",
      "00001110000000", "00111100000000", "01110000000000", "11111111110000",
      "11111111111110", "00000000011110"];
   numbmp[3] = [
      "000000111111000", "000011111111110", "000111100000111", "000110000000011",
      "000000000000011", "000000000000011", "000000000001110", "000000111111000",
      "000000111111000", "000000000011100", "000000000001100", "000000000001100",
      "110000000001100", "111000000011100", "111100000111000", "001111111110000",
      "000111111000000"];
   numbmp[4] = [
      "00000011000001", "00000110000011", "00001100000010", "00011000000110",
      "00111000000110", "00110000001100", "01100000001100", "01100000001000",
      "11000000011000", "11111111111111", "11111111111111", "00000000110000",
      "00000000110000", "00000000100000", "00000001100000", "00000001100000",
      "00000001100000"];
   numbmp[5] = [
      "0000001111111111", "0000011111111111", "0000111000000000", "0000110000000000",
      "0000110000000000", "0001110000000000", "0001101111100000", "0001111111111000",
      "0001110000011000", "0000000000001100", "0000000000001100", "0000000000001100",
      "1100000000001100", "1110000000011000", "1111000001111000", "0111111111100000",
      "0001111110000000"];
   numbmp[6] = [
      "000000001111100", "000000111111110", "000011110000111", "000111000000011", "000110000000000", "001100000000000", "011001111100000", "011111111111000",
      "111110000011000", "111000000001100", "110000000001100", "110000000001100",
      "110000000001100", "111000000011000", "011100001110000", "001111111100000",
      "000111110000000"];
   numbmp[7] = [
      "1111111111111", "1111111111111", "0000000001110", "0000000011100",
      "0000000111000", "0000000110000", "0000001100000", "0000011100000",
      "0000111000000", "0000110000000", "0001100000000", "0011100000000",
      "0011000000000", "0111000000000", "1110000000000", "1100000000000",
      "1100000000000"];
   numbmp[8] = [
      "0000000111110000", "0000011111111100", "0000011000001110", "0000110000000111",
      "0000110000011111", "0000110001111000", "0000011111100000", "0000011110000000",
      "0001111111000000", "0011100011100000", "0111000001110000", "1110000000110000",
      "1100000000110000", "1100000001110000", "1110000011100000", "0111111111000000",
      "0001111100000000"];
   numbmp[9] = [
      "0000011111000", "0001111111110", "0011100000110", "0011000000011",
      "0110000000011", "0110000000011", "0110000000011", "0110000000111",
      "0011000011110", "0011111111110", "0000111100110", "0000000001100",
      "0000000011000", "0000000111000", "0000011110000", "1111111000000",
      "1111110000000"];
   return numbmp;
}

function captchapng(width, height, dispNumber) {
   this.width   = width;
   this.height  = height;
   this.depth   = 8;
   this.dispNumber = '' + dispNumber.toString();
   this.widthAverage = parseInt(this.width/this.dispNumber.length);

   let p = new pnglib(this.width,this.height,this.depth);

   for (let numSection = 0; numSection < this.dispNumber.length; numSection++) {

      let dispNum = this.dispNumber[numSection].valueOf();

      let font = parseInt(Math.random()*myself.numMask.length);
      font = (font >= myself.numMask.length ? 0 : font);
      let random_x_offs = parseInt(Math.random()*(this.widthAverage - myself.numMask[font][dispNum][0].length));
      let random_y_offs = parseInt(Math.random()*(this.height - myself.numMask[font][dispNum].length));
      random_x_offs = (random_x_offs < 0 ? 0 : random_x_offs);
      random_y_offs = (random_y_offs < 0 ? 0 : random_y_offs);

      for (let i=0;(i<myself.numMask[font][dispNum].length) && ((i+random_y_offs)<this.height);i++){
         let lineIndex = p.index(this.widthAverage * numSection + random_x_offs,i+random_y_offs);
         for (let j = 0; j < myself.numMask[font][dispNum][i].length; j++){
            if (
               (myself.numMask[font][dispNum][i][j] == '1') &&
               (this.widthAverage * numSection + random_x_offs+j) < this.width
            ) p.buffer[lineIndex+j] = '\x01';
         }
      }
   }
   return p;
}

/**
 * Генерирование капчи высотой 30px из числа num
 * © 2019, Александр Гольдин a@goldin.su
 * 
 * Пример аргумента opt:
 * let opt = {
 *   bkR: 246, bkG: 243, bkB: 240, // фоновый цвет
 *   fnR: 214, fnG: 191, fnB: 168, // цвет шрифта   
 * }
 */
module.exports = function (num, opt) {
   let w = num.toString().length * 20;
   let capt = new captchapng(w, 30, num);
   capt.color(opt.bkR, opt.bkG, opt.bkB, 255);
   capt.color(opt.fnR, opt.fnG, opt.fnB, 255);
   let result = capt.getBase64();
   return new Buffer.from(result, "base64");
}
