#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Crea Canciones.db junto a este archivo, sin reemplazar una base existente.

Uso desde la carpeta del proyecto:
    py crear_bdd.py
    py crear_bdd.py --crear-admin

Solo utiliza módulos incluidos en Python. No necesita pip ni node_modules.
Las definiciones corresponden al esquema existente de RockArg.
Incluye el catálogo de entrega. No necesita recibir Canciones.db ni otro
archivo de datos: este script contiene los registros necesarios.
"""

import argparse
from contextlib import closing
import getpass
from pathlib import Path
import re
import sqlite3
import sys


RUTA_BASE = Path(__file__).resolve().parent / "Canciones.db"

# Catálogo incluido en la entrega. No contiene cuentas ni contraseñas personales.
# Se omite únicamente la canción ID 203: referenciaba el álbum inexistente 29.

BANDAS = [(1, 'Soda Stereo', 'soda_stereo.jpg'),
 (2, 'Patricio Rey y Sus Redonditos de Ricota', 'patricio_rey.jpg'),
 (3, 'Fito Paez', 'fito_paez.jpg'),
 (4, 'Las Pelotas', 'las_pelotas.jpeg'),
 (5, 'Divididos', 'divididos.jpg'),
 (6, 'Serú Giran', 'seru giran.jpg'),
 (7, 'Charly García ', 'charly_garcia.jpg'),
 (8, 'Pescado Rabioso', 'pescado_rabioso.jpg'),
 (9, 'Los Tipítos', 'los_tipitos.jpg'),
 (10, 'Los Piojos ', 'los_piojos.png'),
 (11, 'Babasonicos', 'babasonicos.jpg'),
 (12, 'Gustavo Cerati', 'cerati.jpg'),
 (13, 'Ciro y los Persas', 'ciro_y_los_persas.jpg'),
 (14, 'Los Enanitos Verdes', 'los_enanitos_verdes.jpg'),
 (15, 'Los Autenticos Decadentes', 'los_autenticos_decadentes.jpeg'),
 (16, 'Pappo', 'pappo.jpeg'),
 (17, 'Andrés Calamaro', 'calamaro.jpg'),
 (18, 'Intoxicados', 'intoxicados.jpg'),
 (19, 'Airbag', 'airbag.jpg'),
 (20, 'Bersuit Vergarabat', 'bersuit_vergarabat.jpg'),
 (21, 'Turf', 'turf.jpg'),
 (22, 'Viejas Locas', 'viejas_locas.jpg'),
 (23, 'La Mancha de Rolando', 'la_mancha_de_rolando.jpg'),
 (24, 'Callejeros', 'callejeros.jpg'),
 (25, 'No te va a Gustar', 'no_te_va_a_gustar.jpg'),
 (26, 'La Renga', 'la_renga.webp')]

DISCOS = [('1', 'Soda Stereo', 1984, '1', 'soda stereo.jpg'),
 ('2', 'Nada Personal', 1985, '1', 'nada personal.jpg'),
 ('3', 'Signos', 1986, '1', 'signos.jpg'),
 ('4', 'Doble Vida', 1988, '1', 'doble vida.jpg'),
 ('5', 'Cancion Animal', 1990, '1', 'cancion animal.jpg'),
 ('6', 'Dynamo', 1992, '1', 'dynamo.jpg'),
 ('7', 'Sueño Stereo', 1995, '1', 'sueño stereo.jpg'),
 ('8', ' Comfort y musica para volar (MTV Unplugged)', 1996, '1', 'comfort y musica para volar.jpg'),
 ('9', 'GULP!', 1985, '2', 'gulp.jpg'),
 ('10', 'Oktubre', 1986, '2', 'oktubre.jpg'),
 ('11', 'Un Baión Para el Ojo Idiota', 1988, '2', 'un baion para el ojo idiota.jpg'),
 ('12', '¡Bang! ¡Bang!... Estás Liquidado', 1989, '2', 'bang bang.jpg'),
 ('13', 'La Mosca y la Sopa', 1991, '2', 'la mosca y la sopa.jpg'),
 ('14', 'Lobo Suelto', 1993, '2', 'lobo suelto.jpg'),
 ('15', 'Cordero Atado', 1993, '2', 'cordero atado.jpg'),
 ('16', 'Luzbelito', 1996, '2', 'luzbelito.jpg'),
 ('17', 'Último Bondi a Finisterre', 1998, '2', 'ultimo bondi a finisterre.jpg'),
 ('18', 'Momo Sampler', 2000, '2', 'momo sampler.jpg'),
 ('19', 'Acariciando lo Áspero', 1991, '5', 'acariciando lo aspero.jpg'),
 ('20', 'La Era de la Boludez', 1993, '5', 'la era de la boludez.jpg'),
 ('21', 'Narigón del Siglo', 2000, '5', 'narigon del siglo.jpg'),
 ('22', 'El Amor Después del Amor', 1992, '3', 'el amor despues del amor.jpg'),
 ('23', 'Circo Beat', 1994, '3', 'mariposa teckicolor.jpg'),
 ('24', 'Esperando el Milagro', 2003, '4', 'esperando el milagro.jpg'),
 ('25', 'Serú Giran', 1978, '6', 'seru giran.jpg'),
 ('26', 'Yendo de mi Cama al Living', 1982, '7', 'yendo de la cama al living.jpg'),
 ('27', 'Piano Bar', 1984, '7', 'piano bar.jpg'),
 ('28', 'Parte de la Religion', 1987, '7', 'parte de la religion.jpg'),
 ('30', 'Armando Camaleón', 2004, '9', 'armando camaleon.JPEG'),
 ('31', 'Big Bang', 1994, '14', 'big bang.JPEG'),
 ('32', 'Buscando un amor', 2003, '16', 'pappo buscando un amor.JPEG'),
 ('33', 'Viaje', 2004, '23', 'viaje.JPEG'),
 ('34', 'El calor del pleno invierno', 2012, '25', 'el calor del pleno invierno.JPEG'),
 ('35', 'El camino más largo', 2008, '25', 'el camino mas largo.JPEG'),
 ('36', 'Presión', 2003, '24', 'presion.JPEG'),
 ('37', 'Rocanroles sin destino', 2004, '24', 'rocanroles sin destino.JPEG'),
 ('38', 'Señales', 2006, '24', 'señales.JPEG'),
 ('39', 'Ahí vamos', 2006, '12.0', 'ahi vamos.JPEG'),
 ('40', 'Fuerza natural', 2009, '12', 'fuerza natural.JPEG'),
 ('41', 'No Es Solo Rock And Roll', 2003, '18', 'no es solo rock and roll.JPEG'),
 ('42', 'Otro Día en el Planeta Tierra', 2005, '18', 'otro dia en el planeta tierra.JPEG'),
 ('43', 'Chac Tu Chac', 1992, '10', 'chac tu chac.JPEG'),
 ('44', 'Civilización', 2007, '10', 'civilizacion.JPEG'),
 ('45', '3er Arco', 1996, '10', '3er arco.JPEG'),
 ('46', 'Máquina de Sangre', 2003, '10', 'maquina de sangre.JPEG'),
 ('47', 'Verde Paisaje del Infierno', 2000, '10', 'verde paisaje del infierno.JPEG'),
 ('48', 'Ay Ay Ay', 1994, '10', 'ay ay ay.JPEG'),
 ('49', '27', 2012, '13', '27.JPEG'),
 ('50', 'Hijos del Culo', 2000, '20', 'hijos del culo.JPEG'),
 ('51', 'La Argentinidad al Palo', 2004, '20', 'la argentinidad al palo.JPEG'),
 ('52', 'Infame', 2003, '11', 'infame.JPEG'),
 ('53', 'Mucho', 2008, '11', 'mucho.JPEG'),
 ('54', 'Libertad', 2013, '19', 'libertad.JPEG'),
 ('55', 'Mentira la Verdad', 2016, '19', 'mentira la verdad.JPEG'),
 ('56', 'Al Parecer Todo Ha Sido una Trampa', 2021, '19', 'al parecer todo ha sido una trampa.JPEG'),
 ('57', 'Vorágine', 2011, '19', 'voragine.JPEG'),
 ('58', 'Alta Suciedad', 1997, '17', 'alta suciedad.JPEG'),
 ('59', 'Honestidad Brutal', 1999, '17', 'honestidad brutal.JPEG'),
 ('60', 'TurfShow', 2001, '21', 'turf.JPEG'),
 ('61', 'Para mi Para vos', 2004, '21', 'para mi para vos.JPEG'),
 ('62', 'La Renga (homónimo)', 1998, '26.0', 'la renga.jpg'),
 ('63', 'El Milagro Argentino', 1989, '15.0', 'el milagro argentino.jpg'),
 ('64', 'Mi Vida Loca', 1995, '15.0', 'mi vida loca.jpg')]

CANCIONES = [(1, '¿Por qué no puedo ser del Jet-Set?', 1, 'https://www.youtube.com/watch?v=kMMQ-lvsHqk', 140, None),
 (2, 'Sobredosis de TV', 1, 'https://www.youtube.com/watch?v=Ri38vudqTUM', 249, None),
 (3, 'Te Hacen Falta Vitaminas', 1, 'https://www.youtube.com/watch?v=I5uh7aITfow', 158, None),
 (4,
  'Trátame Suavemente',
  1,
  'https://www.youtube.com/watch?v=p3h1PMO9hJk',
  200,
  'Tratame Suavemente.mp3'),
 (5, 'Dietético', 1, 'https://www.youtube.com/watch?v=QhtrGsRQHHs', 226, None),
 (6, 'Tele-Ka', 1, 'https://www.youtube.com/watch?v=hhrc2P3ZG-8', 144, None),
 (7, 'Ni un Segundo', 1, 'https://www.youtube.com/watch?v=-yWJ-nyxgk8', 205, None),
 (8, 'Un misil en mi placard', 1, 'https://www.youtube.com/watch?v=ZDcG1nYXp-g', 184, None),
 (9, 'El tiempo es dinero', 1, 'https://www.youtube.com/watch?v=6OGssC4Y41M', 174, None),
 (10, 'Afrodisíacos', 1, 'https://www.youtube.com/watch?v=i0bPGVACm5U', 259, None),
 (11, 'Mi novia tiene bíceps', 1, 'https://www.youtube.com/watch?v=4Zh4ang27MQ', 144, None),
 (12, 'Nada Personal', 2, 'https://www.youtube.com/watch?v=ko24BZXdK8c', 297, None),
 (13, 'Si no fuera por...', 2, 'https://www.youtube.com/watch?v=nfz6u9drTfE', 210, None),
 (14, 'Cuando pase el temblor', 2, 'https://www.youtube.com/watch?v=ZNzYr4U7Zs8', 228, None),
 (15, 'Danza rota', 2, 'https://www.youtube.com/watch?v=R2f8KvURNw8', 212, None),
 (16, 'El cuerpo del delito', 2, 'https://www.youtube.com/watch?v=_9uk9g7EcA8', 230, None),
 (17, 'Juego de seducción', 2, 'https://www.youtube.com/watch?v=Pk06GUU2-nU', 196, None),
 (18, 'Estoy azulado', 2, 'https://www.youtube.com/watch?v=uOlCYVXOyFI', 313, None),
 (19, 'Observándonos (Satélites)', 2, 'https://www.youtube.com/watch?v=g5a-2dTBZG4', 189, None),
 (20, 'Imágenes retro', 2, 'https://www.youtube.com/watch?v=Zes-fOWXtIs', 235, None),
 (21, 'Ecos', 2, 'https://www.youtube.com/watch?v=xw9cgCr0VmE', 298, None),
 (22, 'Sin sobresaltos', 3, 'https://www.youtube.com/watch?v=xiYMsOtPa5c', 262, None),
 (23, 'El rito', 3, 'https://www.youtube.com/watch?v=6VensWNwjow', 366, None),
 (24, 'Prófugos', 3, 'https://www.youtube.com/watch?v=VJhTfRqg0cw', 317, 'Prófugos.mp3'),
 (25, 'No Existes', 3, 'https://www.youtube.com/watch?v=C5vRGvsbz0w', 283, None),
 (26,
  'Persiana Americana',
  3,
  'https://www.youtube.com/watch?v=LalPz4lIZYk',
  292,
  'Persiana Americana.mp3'),
 (27, 'En Camino', 3, 'https://www.youtube.com/watch?v=PPnCNC75ny0', 269, None),
 (28, 'Signos', 3, 'https://www.youtube.com/watch?v=CEb99v79yRM', 315, 'Signos.mp3'),
 (29, 'Final Caja Negra', 3, 'https://www.youtube.com/watch?v=eDSI30SQbZA', 343, None),
 (30, 'Picnic en el 4° B', 4, 'https://www.youtube.com/watch?v=xeN9EYnsES8', 220, None),
 (31,
  'En la Ciudad de la Furia',
  4,
  'https://www.youtube.com/watch?v=AVEDgT_lG60',
  346,
  'En la ciudad de la furia.mp3'),
 (32, 'Lo Que Sangra (La Cúpula)', 4, 'https://www.youtube.com/watch?v=Y-RQQds52qs', 273, None),
 (33, 'En El Borde', 4, 'https://www.youtube.com/watch?v=Z0ukDGXNYLU', 282, None),
 (34, 'Languis', 4, 'https://www.youtube.com/watch?v=GNNW9tPmAk4', 234, None),
 (35, 'Día Común - Doble Vida', 4, 'https://www.youtube.com/watch?v=lxWYAUF-mak', 279, None),
 (36, 'Corazón Delator', 4, 'https://www.youtube.com/watch?v=tX1nCmFUaVM', 312, None),
 (37, 'El Ritmo de Tus Ojos', 4, 'https://www.youtube.com/watch?v=x8PopNQrmnU', 237, None),
 (38, 'Terapia de Amor Intensiva', 4, 'https://www.youtube.com/watch?v=i07wJusYmxw', 340, None),
 (39, '(En) El Séptimo día', 5, None, 282, None),
 (40, 'Un Millón de Años Luz', 5, 'https://www.youtube.com/watch?v=oIkwabfzvO0', 304, None),
 (41, 'Canción Animal', 5, 'https://www.youtube.com/watch?v=_TjJZpX7iLg', 247, None),
 (42, '1990 (Mil Nueve Noventa)', 5, 'https://www.youtube.com/watch?v=W7CSB_acwHo', 218, None),
 (43, 'Sueles Dejarme Solo', 5, 'https://www.youtube.com/watch?v=1XVZDB6feFQ', 226, None),
 (44, 'De Música Ligera', 5, 'https://www.youtube.com/watch?v=T_FkEw27XJ0', 210, 'de_musica_ligera.mp3'),
 (45, 'Hombre al Agua', 5, 'https://www.youtube.com/watch?v=KP2iIkQNM9w', 355, None),
 (46, 'Entre Caníbales', 5, 'https://www.youtube.com/watch?v=vKlmwJZOrXM', 246, None),
 (47, 'Té para 3', 5, 'https://www.youtube.com/watch?v=ak4j3LaawYE', 145, None),
 (48, 'Cae el Sol', 5, 'https://www.youtube.com/watch?v=wzQngYPBzWU', 262, None),
 (49, 'Secuencia Inicial', 6, 'https://www.youtube.com/watch?v=-C788EVxJpE', 207, None),
 (50, 'Toma la Ruta', 6, 'https://www.youtube.com/watch?v=BoGistderf0', 268, None),
 (51, 'En Remolinos', 6, 'https://www.youtube.com/watch?v=0Zxz-jd5iO4', 278, None),
 (52, 'Primavera 0', 6, 'https://www.youtube.com/watch?v=0MjARG5cKRw', 219, None),
 (53, 'Camaleón', 6, 'https://www.youtube.com/watch?v=zEsVkFmyLbg', 281, None),
 (54, 'Luna Roja', 6, 'https://www.youtube.com/watch?v=Y6FyYnhxREs', 330, None),
 (55, 'Sweet Sahumerio', 6, 'https://www.youtube.com/watch?v=rMPOr-d34lE', 363, None),
 (56, 'Ameba', 6, 'https://www.youtube.com/watch?v=2tZ3lNKG18A', 256, None),
 (57, 'Nuestra Fe', 6, 'https://www.youtube.com/watch?v=HqNPz5KfVms', 396, None),
 (58, 'Claroscuro', 6, 'https://www.youtube.com/watch?v=76v5j_TWYUU', 245, None),
 (59, 'Fue', 6, 'https://www.youtube.com/watch?v=mxtZdyBa0wY', 232, None),
 (60, 'Texturas', 6, 'https://www.youtube.com/watch?v=ANnNruhiYus', 284, None),
 (61,
  'Ella Usó Mi Cabeza Como un Revólver',
  7,
  'https://www.youtube.com/watch?v=1zzzby2tAQM',
  272,
  None),
 (62, 'Disco Eterno', 7, 'https://www.youtube.com/watch?v=5YAtLKLX_JI', 345, None),
 (63, 'Zoom', 7, 'https://www.youtube.com/watch?v=HBO2nDIYi0E', 206, None),
 (64, 'Ojo de la Tormenta', 7, 'https://www.youtube.com/watch?v=QzMLoZkKmtU', 273, None),
 (65, 'Efecto Doppler', 7, 'https://www.youtube.com/watch?v=XLyAmsG6ZDw', 302, None),
 (66, 'Paseando por Roma', 7, 'https://www.youtube.com/watch?v=Sykj2i-skTw', 214, None),
 (67, 'Pasos', 7, 'https://www.youtube.com/watch?v=2BFLED_08qo', 232, None),
 (68, 'Ángel Eléctrico', 7, 'https://www.youtube.com/watch?v=aiUvmj8yq1o', 276, None),
 (69, 'Crema de Estrellas', 7, 'https://www.youtube.com/watch?v=Y9fr_jUGkfc', 243, None),
 (70, 'Planta', 7, 'https://www.youtube.com/watch?v=BLUwBfNzvzw', 277, None),
 (71, 'X Playo', 7, 'https://www.youtube.com/watch?v=9e4aff-C-dk', 247, None),
 (72, 'Moirè', 7, 'https://www.youtube.com/watch?v=vaPNttqa6sg', 242, None),
 (73, 'Un Misil En Mi Placard (MTV)', 8, 'https://www.youtube.com/watch?v=Yjg2WwT3Xv4', 274, None),
 (74, 'En La Ciudad de la Furia (MTV)', 8, 'https://www.youtube.com/watch?v=FEzSxNOU6uk', 518, None),
 (75, 'Entre Canibales (MTV)', 8, 'https://www.youtube.com/watch?v=Tbm6aDymg8o', 294, None),
 (76, 'Pasos (MTV)', 8, 'https://www.youtube.com/watch?v=lys7Pq-nDhE', 163, None),
 (77, 'Zoom (MTV)', 8, 'https://www.youtube.com/watch?v=6XCc2pu7tCY', 309, None),
 (78, 'Cuando Pase el Temblor (MTV)', 8, 'https://www.youtube.com/watch?v=IgoN7iXv0TA', 284, None),
 (79, 'Té Para Tres (MTV)', 8, 'https://www.youtube.com/watch?v=KKxlkJkVULM', 406, None),
 (80, 'Ángel Eléctrico (MTV)', 8, 'https://www.youtube.com/watch?v=tLkxx_shJdg', 427, None),
 (81, 'Terapia de Amor Intensivo (MTV)', 8, 'https://www.youtube.com/watch?v=nCocPz8G_dE', 350, None),
 (82, 'Disco Eterno (MTV)', 8, 'https://www.youtube.com/watch?v=3BhkV-3IyYE', 354, None),
 (83,
  'Ella Usó Mi Cabeza Como Un Revolver (MTV)',
  8,
  'https://www.youtube.com/watch?v=qg8QsL2yPBU',
  251,
  None),
 (84, 'Sonoman (MTV)', 8, 'https://www.youtube.com/watch?v=oFejRtkFmnA', 390, None),
 (85, 'Coral (MTV)', 8, 'https://www.youtube.com/watch?v=Y4cTUskd6io', 364, None),
 (86, 'Superstar (MTV)', 8, 'https://www.youtube.com/watch?v=soTw8dM-4-0', 257, None),
 (87, 'Planeador', 8, 'https://www.youtube.com/watch?v=GYPh-iSDPU4', 275, None),
 (88, 'Barbazul versus el amor letal', 9, 'https://www.youtube.com/watch?v=GpN9rS-xH6g', 259, None),
 (89, 'La bestia pop', 9, 'https://www.youtube.com/watch?v=PAq7xAqXTxk', 247, None),
 (90, 'Roto y mal parado', 9, 'https://www.youtube.com/watch?v=J7j9RTiuCIc', 275, None),
 (91, 'Pierre, el vitricida', 9, 'https://www.youtube.com/watch?v=9okF2K3qVmA', 65, None),
 (92, 'Unos pocos peligros sensatos', 9, 'https://www.youtube.com/watch?v=JfrQmnSkz70', 185, None),
 (93, 'Yo no me caí del cielo', 9, 'https://www.youtube.com/watch?v=k7I2LkBki7Y', 184, None),
 (94, 'Te voy a atornillar', 9, 'https://www.youtube.com/watch?v=SwnSNphtAIQ', 213, None),
 (95, 'Superlógico', 9, 'https://www.youtube.com/watch?v=CQgHpBNU8Ps', 184, None),
 (96, 'Ñam fri frufi fali fru', 9, 'https://www.youtube.com/watch?v=fO2p3_u6MfQ', 160, None),
 (97,
  'El infierno está encantador esta noche',
  9,
  'https://www.youtube.com/watch?v=VfIHXwi2ZBk',
  292,
  'gulp.mp3'),
 (98, 'Criminal mambo', 9, 'https://www.youtube.com/watch?v=gEi1Mhjk-50', 292, None),
 (99, 'Fuegos de Oktubre', 10, 'https://www.youtube.com/watch?v=IDg3e3VhcIc', 217, None),
 (100, 'Preso en mi ciudad', 10, 'https://www.youtube.com/watch?v=7ucP8NOtVtM', 243, None),
 (101, 'Música para pastillas', 10, 'https://www.youtube.com/watch?v=VMbDoQkQdFo', 274, None),
 (102, 'Semen-Up', 10, 'https://www.youtube.com/watch?v=JghZXEEYY0E', 321, None),
 (103, 'Divina TV Führer', 10, 'https://www.youtube.com/watch?v=YWBwQo4dvoQ', 181, None),
 (104, 'Motor Psico', 10, 'https://www.youtube.com/watch?v=6mFGt0UgA_w', 296, None),
 (105, 'Ji ji ji', 10, 'https://www.youtube.com/watch?v=CnJqYsSOgfg', 334, 'ji ji ji.mp3'),
 (106, 'Canción para naufragios', 10, 'https://www.youtube.com/watch?v=_dobFq8tGFI', 361, None),
 (107, 'Ya nadie va a escuchar tu remera', 10, 'https://www.youtube.com/watch?v=CWhwpcf28Ws', 239, None),
 (108, 'Masacre en el puticlub', 11, 'https://www.youtube.com/watch?v=KwuRcvYWbFs', 288, None),
 (109, 'Noticias de ayer', 11, 'https://www.youtube.com/watch?v=w4NPGCoWxdI', 265, None),
 (110, 'Aquella solitaria vaca cubana', 11, 'https://www.youtube.com/watch?v=PpDCtJWD_VQ', 256, None),
 (111, 'Todo preso es político', 11, 'https://www.youtube.com/watch?v=uKJV1M74dVs', 356, None),
 (112,
  'Vencedores vencidos',
  11,
  'https://www.youtube.com/watch?v=17Bz8rNJNsQ',
  210,
  'vencedores_vencidos.mp3'),
 (113, 'Vamos las bandas', 11, 'https://www.youtube.com/watch?v=z8gopoZIdUE', 207, None),
 (114, 'Ella debe estar tan linda', 11, 'https://www.youtube.com/watch?v=DFEKIxJHLMQ', 242, None),
 (115, 'Todo un palo', 11, 'https://www.youtube.com/watch?v=XhYiBaYux4Y', 445, None),
 (116, 'Héroe del whisky', 12, 'https://www.youtube.com/watch?v=U6safBme9ck', 220, None),
 (117, 'Rock para los dientes', 12, 'https://www.youtube.com/watch?v=f0fpZ3OnQKc', 208, None),
 (118, 'La parabellum del buen psicópata', 12, 'https://www.youtube.com/watch?v=luy7XGGzj6c', 355, None),
 (119, 'Un pacman en el Savoy', 12, 'https://www.youtube.com/watch?v=dyl98amTFAg', 210, None),
 (120, 'Nadie es perfecto', 12, 'https://www.youtube.com/watch?v=imkWsV9HP5c', 141, None),
 (121, 'Esa estrella era mi lujo', 12, 'https://www.youtube.com/watch?v=SePSMFlQcek', 174, None),
 (122,
  'Maldición, va a ser un día hermoso',
  12,
  'https://www.youtube.com/watch?v=7e2_KXxcm8k',
  147,
  None),
 (123, 'Ropa sucia', 12, 'https://www.youtube.com/watch?v=-C5fVDXmOYU', 263, None),
 (124, 'Nuestro amo juega al esclavo', 12, 'https://www.youtube.com/watch?v=HpZW1QzxOYc', 240, None),
 (125, 'Toxi-Taxi', 13, 'https://www.youtube.com/watch?v=NkCrkbL0jR4', 219, None),
 (126, 'Fusilados por la Cruz Roja', 13, 'https://www.youtube.com/watch?v=khzHfCRYwIQ', 255, None),
 (127, 'Un poco de amor francés', 13, 'https://www.youtube.com/watch?v=WlFLpKaC4_c', 206, None),
 (128, 'Mi perro dinamita', 13, 'https://www.youtube.com/watch?v=84DBTr67OnY', 155, None),
 (129, 'Blues de la artillería', 13, 'https://www.youtube.com/watch?v=MFMXVm_Ii9Q', 269, None),
 (130, 'Tarea fina', 13, 'https://www.youtube.com/watch?v=regpkbAt5MU', 223, None),
 (131,
  'El pibe de los astilleros',
  13,
  'https://www.youtube.com/watch?v=DRf5Nzgq3Lk',
  212,
  'el_pibe_de_los_astilleros.mp3'),
 (132, 'Nueva Roma', 13, 'https://www.youtube.com/watch?v=d0P9psQdooY', 192, None),
 (133, 'Salando las heridas', 13, 'https://www.youtube.com/watch?v=8-T4kXfp-1U', 302, None),
 (134, 'Queso ruso', 13, 'https://www.youtube.com/watch?v=uEWQmm3qYt0', 293, None),
 (135, 'Invocación', 14, 'https://www.youtube.com/watch?v=FfxEugTPV4E', 59, None),
 (136, 'Rock para el negro Atila', 14, 'https://www.youtube.com/watch?v=vOoWYLq-p4A', 240, None),
 (137, 'Sorpresa de Shangai', 14, 'https://www.youtube.com/watch?v=iLX_-1_oaCM', 219, None),
 (138, 'Shopping disco-zen', 14, 'https://www.youtube.com/watch?v=3dsfdORUhXY', 168, None),
 (139, 'Un ángel para tu soledad', 14, 'https://www.youtube.com/watch?v=usC1r3DVbIY', 231, None),
 (140, 'Buenas noticias', 14, 'https://www.youtube.com/watch?v=8CAaAFsUqPU', 223, None),
 (141, 'Susanita', 14, 'https://www.youtube.com/watch?v=dVqpCCudu54', 223, None),
 (142, 'Capricho magyar', 14, 'https://www.youtube.com/watch?v=CCpSMcThGIY', 58, None),
 (143, 'Espejismo', 14, 'https://www.youtube.com/watch?v=oja3ptYIesk', 335, None),
 (144, 'Gran Lady', 14, 'https://www.youtube.com/watch?v=UfMfcogeC6g', 210, None),
 (145, 'La hija del fletero', 14, 'https://www.youtube.com/watch?v=XacNmPqBork', 193, None),
 (146, 'El lobo caído', 14, 'https://www.youtube.com/watch?v=DeHgCrV1DYM', 217, None),
 (147, 'Sushi', 14, 'https://www.youtube.com/watch?v=OxB_eUiY-3c', 67, None),
 (148, 'Yo caníbal', 15, 'https://www.youtube.com/watch?v=y2uBzWkFAN8', 176, None),
 (149, 'Ladrón de mi cerebro', 15, 'https://www.youtube.com/watch?v=ITyOa0NtFt0', 214, None),
 (150, '¡Es hora de levantarse, querido!', 15, 'https://www.youtube.com/watch?v=IVLX8gj8bB4', 216, None),
 (151, 'Perdiendo el tiempo', 15, 'https://www.youtube.com/watch?v=fN8r9qQ98CE', 232, None),
 (152, 'Caña seca y un membrillo', 15, 'https://www.youtube.com/watch?v=qUHdDy4_3lA', 268, None),
 (153, 'Soga de Caín', 15, 'https://www.youtube.com/watch?v=iJ_xVbcsZSk', 80, None),
 (154, 'Lavi-Rap', 15, 'https://www.youtube.com/watch?v=6eW87gMb9rg', 251, None),
 (155, 'El arte del buen comer', 15, 'https://www.youtube.com/watch?v=7Gvvis9-1yA', 276, None),
 (156, '¿Lobo estás?', 15, 'https://www.youtube.com/watch?v=moWXGVHCmOo', 181, None),
 (157, 'Botija rapado', 15, 'https://www.youtube.com/watch?v=WcwYCJza9Xg', 168, None),
 (158, 'San Telmo', 15, 'https://www.youtube.com/watch?v=q7dfO4XJMoM', 42, None),
 (159, 'Etiqueta negra', 15, 'https://www.youtube.com/watch?v=I-93xIHakJs', 336, None),
 (160, 'Luzbelito y las sirenas', 16, 'https://www.youtube.com/watch?v=Kvw_FSDO3_c', 246, None),
 (161, 'Cruz diablo', 16, 'https://www.youtube.com/watch?v=fvlHgT6LVuI', 253, None),
 (162, 'Ella baila con todos', 16, 'https://www.youtube.com/watch?v=yoCs39xinyQ', 299, None),
 (163, 'Fanfarria del cabrío', 16, 'https://www.youtube.com/watch?v=ibCmrt1Xk1Q', 308, None),
 (164, 'Nuotatori Professionisti', 16, 'https://www.youtube.com/watch?v=sNLNHku12Fc', 281, None),
 (165, 'Blues de la libertad', 16, 'https://www.youtube.com/watch?v=kDRBvMl0jsY', 300, None),
 (166, 'La dicha no es una cosa alegre', 16, 'https://www.youtube.com/watch?v=0NztE7Lqa0k', 337, None),
 (167, 'Me matan Limón', 16, 'https://www.youtube.com/watch?v=LSqVOHYNXIM', 215, None),
 (168, 'Rock yugular', 16, 'https://www.youtube.com/watch?v=6o0DdsgmDkQ', 424, None),
 (169, 'Mariposa Pontiac', 16, 'https://www.youtube.com/watch?v=S1AlY7WWQpM', 289, None),
 (170, 'Juguetes perdidos', 16, 'https://www.youtube.com/watch?v=U6lI8FkG8UI', 429, None),
 (171,
  'Las increíbles andanzas del Capitán Buscapina en Cybersiberia',
  17,
  'https://www.youtube.com/watch?v=YpinwwRlMpM',
  288,
  None),
 (172, 'Estás frito, Angelito', 17, 'https://www.youtube.com/watch?v=UNATlqhoJf4', 274, None),
 (173, 'El árbol del gran bonete', 17, 'https://www.youtube.com/watch?v=PK0DcmtyYNs', 312, None),
 (174, 'Gualicho', 17, 'https://www.youtube.com/watch?v=jhjbYUBJLVE', 287, None),
 (175, 'Pogo', 17, 'https://www.youtube.com/watch?v=kW6VAxNCdVI', 285, None),
 (176, 'Alien Duce', 17, 'https://www.youtube.com/watch?v=tGcWJegm0M0', 195, None),
 (177, 'La pequeña novia del carioca', 17, 'https://www.youtube.com/watch?v=mAxOy3C1OHE', 290, None),
 (178, 'Drogocop', 17, 'https://www.youtube.com/watch?v=lbcoZYMT0bg', 183, None),
 (179, 'Scaramanzia', 17, 'https://www.youtube.com/watch?v=58-SylwNL2c', 328, None),
 (180, 'Esto es to-to-todo, amigos', 17, 'https://www.youtube.com/watch?v=w79sYHZ-bLY', 217, None),
 (181, 'El templo de Momo', 18, 'https://www.youtube.com/watch?v=jgZWakz6wrQ', 202, None),
 (182, 'Mortadela punto com', 18, 'https://www.youtube.com/watch?v=d-0cDMi4_c8', 195, None),
 (183, 'La murga de los renegados', 18, 'https://www.youtube.com/watch?v=SCbf3ixExJo', 287, None),
 (184, 'Dr. Saturno', 18, 'https://www.youtube.com/watch?v=ohgSiiEGulM', 328, None),
 (185, 'Murga de la Virgencita', 18, 'https://www.youtube.com/watch?v=riYludogljE', 295, None),
 (186, 'Pool, Averna y Papusa', 18, 'https://www.youtube.com/watch?v=rzG0CLT1sek', 296, None),
 (187, 'Murga Purga', 18, 'https://www.youtube.com/watch?v=Ln_g8jjOnw4', 205, None),
 (188, 'Sheriff', 18, 'https://www.youtube.com/watch?v=Xl3UOwVVM_A', 360, None),
 (189, 'Pensando como una acelga', 18, 'https://www.youtube.com/watch?v=CqAjU3XMDNY', 280, None),
 (190,
  'Una piba con la remera de Greenpeace',
  18,
  'https://www.youtube.com/watch?v=Xr2Cbsrpx2A',
  221,
  None),
 (191, 'Rato Molhado', 18, 'https://www.youtube.com/watch?v=ZziIJfvNkSY', 251, None),
 (192, 'Ala Delta', 19, 'https://www.youtube.com/watch?v=pgmCq3vMTRA', 357, None),
 (193, 'Que ves?', 20, 'https://www.youtube.com/watch?v=CJkgBc2S5oY', 313, 'la_era-.mp3'),
 (194, 'Spaghetti del Rock', 21, 'https://www.youtube.com/watch?v=cdzpf_T2qaA', 212, None),
 (195, 'El Amor Despues del Amor', 22, 'https://www.youtube.com/watch?v=knvgOdKPaMQ', 311, 'paez.mp3'),
 (196, 'A Rodar mi Vida', 22, 'https://www.youtube.com/watch?v=1DYUNaJ_rfU', 281, None),
 (197, 'Mariposa Teckicolor', 23, 'https://www.youtube.com/watch?v=CRBincBc_8k', 222, None),
 (198, 'Será', 24, 'https://www.youtube.com/watch?v=GPeiU6RqIjA', 181, None),
 (199, 'Seminare', 25, 'https://www.youtube.com/watch?v=hyrqdknARv0', 202, 'seru_giran.mp3'),
 (200, 'Inconsciente Colectivo', 26, 'https://www.youtube.com/watch?v=SNZ6Qd58ixI', 246, None),
 (201, 'Promesas Sobre el Bidet', 27, 'https://www.youtube.com/watch?v=7oMApe1k-o4', 164, None),
 (202, 'Rezo por Vos', 28, 'https://www.youtube.com/watch?v=iTA75Z6E4eA', 269, None),
 (204, 'Campanas en la noche', 30, 'https://www.youtube.com/watch?v=sNl9W2WmVrA', 244, None),
 (205, 'Lamento boliviano', 31, 'https://www.youtube.com/watch?v=FWffvczGrhs', 248, None),
 (206, 'Creo', 38, 'https://www.youtube.com/watch?v=ezlpwCLgiE8', 284, None),
 (207, 'Juntos a la par', 32, 'https://www.youtube.com/watch?v=82oqLCiGQvA', 164, None),
 (208, 'Arde la ciudad', 33, 'https://www.youtube.com/watch?v=-8vxXsfbxj4', 247, None),
 (209, 'Chino', 33, 'https://www.youtube.com/watch?v=h5EzNzv4eP4', 266, None),
 (210, 'A las 9', 34, 'https://www.youtube.com/watch?v=30oa0b2mdUo', 207, None),
 (211, 'Ese maldito momento', 34, 'https://www.youtube.com/watch?v=NvB0sFK1sjY', 186, None),
 (212, 'Tan lejos', 35, 'https://www.youtube.com/watch?v=GBsRPUxMkkw', 298, None),
 (213, 'Una nueva noche fría', 36, 'https://www.youtube.com/watch?v=a6a2LhKQJ7Y', 277, None),
 (214, 'Imposible', 36, 'https://www.youtube.com/watch?v=t_8pqgA_3ac', 381, None),
 (215, '9 de julio', 38, 'https://www.youtube.com/watch?v=MsJp_SmQYQo', 226, None),
 (216, 'Prohibido', 37, 'https://www.youtube.com/watch?v=8KFevhw44UY', 210, None),
 (217, 'Rocanroles sin destino', 37, 'https://www.youtube.com/watch?v=RytDN0-bg4A', 240, 'cromañon.mp3'),
 (218, 'Magia blanca', 61, 'https://www.youtube.com/watch?v=_SKaPv4DVgE', 237, None),
 (219, 'Pasos al costado', 61, 'https://www.youtube.com/watch?v=TJkmo1PzfJg', 256, None),
 (220, 'Yo no me quiero casar, y ud?', 60, 'https://www.youtube.com/watch?v=kiKCXChGFgA', 264, None),
 (221, 'Crimen', 39, 'https://www.youtube.com/watch?v=tK0y3fDhSIg', 232, 'cerati.mp3'),
 (222, 'Deja Vu', 40, 'https://www.youtube.com/watch?v=4o6CS_P8HTc', 204, None),
 (223, 'Adiós', 39, 'https://www.youtube.com/watch?v=GUf81ofAZV0', 233, None),
 (224, 'Una vela', 41, 'https://www.youtube.com/watch?v=p9AB6WJMla4', 273, None),
 (225, 'Fuiste lo mejor', 42, 'https://www.youtube.com/watch?v=fxOegvJ72Sc', 269, None),
 (226, 'Nunca quise', 42, 'https://www.youtube.com/watch?v=bdqvUwn1tbE', 260, None),
 (227, 'Tan solo', 43, 'https://www.youtube.com/watch?v=8TdbQUBo8iQ', 240, None),
 (228, 'Bicho de ciudad', 44, 'https://www.youtube.com/watch?v=DdzF5zF6DBY', 320, None),
 (229, 'Verano del 92', 45, 'https://www.youtube.com/watch?v=hkGrB2PAgWg', 431, None),
 (230, 'Como Alí', 46, 'https://www.youtube.com/watch?v=vDA8vEvDaMU', 211, None),
 (231, 'Vine hasta aquí', 47, 'https://www.youtube.com/watch?v=427zHJxD060', 278, None),
 (232, 'El Farolito', 45, 'https://www.youtube.com/watch?v=8qYlfhIHwzU', 253, None),
 (233, 'Pacífico', 44, 'https://www.youtube.com/watch?v=OkBQeM_Yejw', 282, None),
 (234, 'Ruleta', 47, 'https://www.youtube.com/watch?v=K6R0lj_k7II', 256, None),
 (235, 'Pistolas', 48, 'https://www.youtube.com/watch?v=xMg4J2n6sGY', 295, None),
 (236, 'Astros', 49, 'https://www.youtube.com/watch?v=yQcaUpZZ-18', 254, None),
 (237, 'Me gusta', 49, 'https://www.youtube.com/watch?v=f2YwQ9AGFd8', 289, None),
 (238, 'Mírenla', 49, 'https://www.youtube.com/watch?v=P-hA2F2p_9g', 294, None),
 (239, 'El viejo de arriba', 50, 'https://www.youtube.com/watch?v=QPYHHqY10Uo', 208, 'hijos.mp3'),
 (240, 'Toco y me voy', 50, 'https://www.youtube.com/watch?v=NDVrzDqwfTE', 249, None),
 (241, 'La Argentinidad al palo', 51, 'https://www.youtube.com/watch?v=972s6-BLGtQ', 273, None),
 (242, 'El baile de la gambeta', 51, 'https://www.youtube.com/watch?v=WGKWSRyNHC8', 260, None),
 (243, 'La soledad', 51, 'https://www.youtube.com/watch?v=QcsQEBHXrl0', 263, None),
 (244, 'Irresponsables', 52, 'https://www.youtube.com/watch?v=gZV2Q9zH2eg', 160, None),
 (245, 'Putita', 52, 'https://www.youtube.com/watch?v=7siu5MQ_8s0', 229, None),
 (246, 'Microdancing', 53, 'https://www.youtube.com/watch?v=tfEr0jtij_g', 204, None),
 (247, 'Por mil noches', 54, 'https://www.youtube.com/watch?v=kdfkr1WEzIc', 283, None),
 (248, 'Cicatrices', 55, 'https://www.youtube.com/watch?v=U3PUjIy6X_Q', 228, None),
 (249, 'Pensamientos', 56, 'https://www.youtube.com/watch?v=6gDGFfrOMdI', 233, 'airbag.mp3'),
 (250, 'Cae el sol', 57, 'https://www.youtube.com/watch?v=FIR-hrPXxzA', 248, None),
 (251, 'Flaca', 58, 'https://www.youtube.com/watch?v=UCF9oHXhDMU', 257, None),
 (252, 'La parte de adelante', 59, 'https://www.youtube.com/watch?v=f0SG-aGlOxE', 320, None),
 (253, 'Noches de Insomnio', 54, None, 203, None),
 (254, 'El Revelde', 62, '', 204, 'el_revelde.mp3'),
 (255, 'Loco (Tu Forma de Ser)', 63, '', 308, None),
 (256, 'La Guitarra', 10, '', 217, None)]


def crear_bandas(conexion):
    """Primero se crea el catálogo de bandas y solistas."""
    conexion.execute('''
        CREATE TABLE "bandas/solista" (
            ID NUMERIC UNIQUE PRIMARY KEY,
            nombre TEXT UNIQUE,
            imagenes TEXT
        )
    ''')


def crear_discos(conexion):
    """Conserva los nombres y tipos actuales, incluido ID de tipo TEXT."""
    conexion.execute('''
        CREATE TABLE "discos" (
            ID TEXT NOT NULL PRIMARY KEY,
            Nombre_Album TEXT NOT NULL,
            año NUMERIC NOT NULL,
            "banda/artista" TEXT,
            imagenes TEXT
        )
    ''')
    # El esquema original no declara FK en "banda/artista".
    # El servidor valida su asociación con "bandas/solista".ID.


def crear_canciones(conexion):
    """La referencia a discos existe porque esa tabla ya fue creada."""
    conexion.execute('''
        CREATE TABLE "todas_las_canciones" (
            ID NUMERIC (3) PRIMARY KEY,
            cancion TEXT (35) NOT NULL,
            album NUMERIC NOT NULL REFERENCES discos (ID)
                ON DELETE CASCADE ON UPDATE CASCADE,
            URLS TEXT,
            duracion NUMERIC,
            archivos TEXT UNIQUE
        )
    ''')


def crear_usuarios(conexion):
    """Conserva las columnas de las cuentas y la lista JSON de favoritos."""
    conexion.execute('''
        CREATE TABLE "Usuarios" (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            mail TEXT NOT NULL COLLATE NOCASE UNIQUE,
            contraseña TEXT NOT NULL,
            nombre_usuario TEXT,
            nombre TEXT,
            usuario TEXT,
            me_gusta TEXT
        )
    ''')
    conexion.execute('''
        CREATE UNIQUE INDEX idx_usuarios_usuario_nocase
        ON Usuarios(usuario COLLATE NOCASE)
    ''')
    # me_gusta no tiene DEFAULT ni CHECK en la base original.
    # El código de registro escribe '[]' al crear una cuenta.


def crear_tabla_administradores(conexion):
    """La referencia a Usuarios se declara después de crear esa tabla."""
    conexion.execute('''
        CREATE TABLE "Usuarios_admin" (
            ID NUMERIC PRIMARY KEY,
            id_usuario NUMERIC REFERENCES Usuarios (ID)
                ON DELETE CASCADE ON UPDATE CASCADE
        )
    ''')


def cargar_catalogo(conexion):
    """Inserta primero artistas, luego discos y por último sus canciones."""
    conexion.executemany(
        'INSERT INTO "bandas/solista" (ID, nombre, imagenes) VALUES (?, ?, ?)', BANDAS
    )
    conexion.executemany(
        'INSERT INTO discos (ID, Nombre_Album, año, "banda/artista", imagenes) VALUES (?, ?, ?, ?, ?)',
        DISCOS,
    )
    conexion.executemany(
        'INSERT INTO todas_las_canciones (ID, cancion, album, URLS, duracion, archivos) VALUES (?, ?, ?, ?, ?, ?)',
        CANCIONES,
    )


def crear_base(ruta=RUTA_BASE):
    """Crea las cinco tablas en orden. Si ya hay una base, no la modifica."""
    ruta = Path(ruta).resolve()
    # La apertura exclusiva evita sobrescribir un archivo, incluso si está vacío.
    try:
        with ruta.open("xb"):
            pass
    except FileExistsError:
        print(f"La base ya existe y no se modificó: {ruta}")
        return False

    conexion = None
    try:
        conexion = sqlite3.connect(ruta)
        conexion.execute("PRAGMA foreign_keys = ON")
        conexion.execute("BEGIN")
        crear_bandas(conexion)
        crear_discos(conexion)
        crear_canciones(conexion)
        crear_usuarios(conexion)
        crear_tabla_administradores(conexion)
        cargar_catalogo(conexion)
        if conexion.execute("PRAGMA foreign_key_check").fetchall():
            raise ValueError("Se encontraron relaciones inválidas.")
        conexion.commit()
    except BaseException:
        if conexion is not None:
            conexion.rollback()
            conexion.close()
            conexion = None
        # Solo elimina el archivo nuevo que creó esta ejecución fallida.
        ruta.unlink(missing_ok=True)
        raise
    finally:
        if conexion is not None:
            conexion.close()
    print(f"Base de datos creada correctamente: {ruta}")
    print(f"Catálogo: {len(BANDAS)} artistas, {len(DISCOS)} álbumes y {len(CANCIONES)} canciones.")
    return True


def solicitar_cuenta_administradora():
    """Solicita credenciales locales; no publica ni fija una contraseña de entrega."""
    nombre = input("Nombre del administrador: ").strip()
    usuario = input("Usuario (3 a 20 caracteres): ").strip()
    clave = getpass.getpass("Contraseña (4 a 128 caracteres): ")
    confirmacion = getpass.getpass("Repetir contraseña: ")
    if not nombre or len(nombre) > 50:
        raise ValueError("El nombre debe tener entre 1 y 50 caracteres.")
    if not re.fullmatch(r"[a-zA-Z0-9_.-]{3,20}", usuario):
        raise ValueError("El usuario admite letras sin tildes, números, punto, guion y guion bajo.")
    if not 4 <= len(clave) <= 128 or clave != confirmacion:
        raise ValueError("Las contraseñas deben coincidir y tener entre 4 y 128 caracteres.")
    return nombre, usuario, clave


def crear_administrador(ruta, nombre, usuario, clave):
    """Crea una cuenta nueva y su permiso juntos, sin modificar cuentas existentes."""
    with closing(sqlite3.connect(Path(ruta).resolve().as_uri() + "?mode=rw", uri=True)) as conexion, conexion:
        conexion.execute("PRAGMA foreign_keys = ON")
        conexion.execute("BEGIN IMMEDIATE")
        if conexion.execute(
            "SELECT ID FROM Usuarios WHERE usuario = ? COLLATE NOCASE OR mail = ? COLLATE NOCASE",
            (usuario, usuario),
        ).fetchone():
            raise ValueError("Ese usuario ya existe. Elegí otro; no se cambió la cuenta existente.")
        cursor = conexion.execute('''
            INSERT INTO Usuarios (mail, contraseña, nombre_usuario, nombre, usuario, me_gusta)
            VALUES (?, ?, ?, ?, ?, '[]')
        ''', (usuario, clave, usuario, nombre, usuario))
        id_permiso = conexion.execute(
            "SELECT COALESCE(MAX(CAST(ID AS INTEGER)), 0) + 1 FROM Usuarios_admin"
        ).fetchone()[0]
        conexion.execute(
            "INSERT INTO Usuarios_admin (ID, id_usuario) VALUES (?, ?)",
            (id_permiso, cursor.lastrowid),
        )
    # Se conserva el formato de credenciales que utiliza el login actual del servidor.
    print("Cuenta administradora creada. Ya podés iniciar sesión con ella en RockArg.")


def main():
    parser = argparse.ArgumentParser(description="Crea la base SQLite de RockArg en la raíz del proyecto.")
    parser.add_argument("--crear-admin", action="store_true", help="Solicitar y crear una cuenta administradora nueva.")
    args = parser.parse_args()
    try:
        creada = crear_base()
        if args.crear_admin:
            crear_administrador(RUTA_BASE, *solicitar_cuenta_administradora())
        elif creada:
            print("Para crear la primera cuenta administradora: py crear_bdd.py --crear-admin")
        return 0
    except (OSError, sqlite3.Error, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    except (KeyboardInterrupt, EOFError):
        print("\nOperación cancelada.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
