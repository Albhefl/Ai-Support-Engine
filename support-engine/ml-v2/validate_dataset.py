"""
Tarea 4 · Quality gate del dataset (Clase 02, diapositivas 6-9).
Autor: José Alberto Herrera Flores

Revisa ml-v2/tickets.csv antes de entrenar:
  - 200 registros, etiquetas válidas y balanceadas (50 por clase).
  - Sin mensajes vacíos ni duplicados exactos.
  - Sin casi duplicados (evita que la misma solicitud caiga en train y test).
  - Sin frases reservadas para probar el modelo después (benchmark y
    diapositivas 13-14), para que la evaluación no venga "respondida".

Uso (desde support-engine/):
    python ml-v2/validate_dataset.py
Termina con código 1 si alguna revisión falla.
"""
import csv
import json
import re
import sys
import unicodedata
from collections import Counter
from itertools import combinations
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATASET = HERE / "tickets.csv"
BENCH = HERE.parent / "bench" / "cases.json"

LABELS = {"ACCESS", "BUG", "FEATURE", "SECURITY"}
EXPECTED_TOTAL = 200
EXPECTED_PER_CLASS = 50
NEAR_DUP_THRESHOLD = 0.6  # Jaccard de palabras de contenido

# Frases que se usarán para probar inferencia: no deben estar en el dataset.
RESERVED = [
    "Encontré datos de otros clientes",                 # diapositiva 13
    "Mi cuenta fue bloqueada tras varios intentos",     # diapositiva 14
    "La pantalla desaparece al confirmar una compra",   # diapositiva 14
    "Puedo abrir información de usuarios ajenos",       # diapositiva 14
    "Alguien entró a mi cuenta sin autorización",       # ejemplo de la Tarea 3
]

STOPWORDS = set("""
a al algo algunos ante con de del desde el ella en entre es esa ese esta este
esto la las le les lo los me mi mis muy no nos o para pero por que se sin
sobre su sus te tengo tu un una uno unos y ya yo cuando como donde hay cada
""".split())


def normalize(text):
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9 ]+", " ", text).split()


def content_words(text):
    return {w for w in normalize(text) if w not in STOPWORDS and len(w) > 2}


def jaccard(a, b):
    return len(a & b) / len(a | b) if a | b else 0.0


def main():
    errors = []
    with DATASET.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != ["message", "category"]:
            errors.append(f"Encabezado inválido: {reader.fieldnames}")
        rows = list(reader)

    # 1. Tamaño, etiquetas y balance
    counts = Counter(r["category"] for r in rows)
    print(f"Registros: {len(rows)}")
    for label in sorted(counts):
        print(f"  {label:<9} {counts[label]}")
    if len(rows) != EXPECTED_TOTAL:
        errors.append(f"Se esperaban {EXPECTED_TOTAL} registros y hay {len(rows)}")
    for label in sorted(set(counts) - LABELS):
        errors.append(f"Etiqueta inválida: {label!r}")
    for label in sorted(LABELS):
        if counts[label] != EXPECTED_PER_CLASS:
            errors.append(f"{label} tiene {counts[label]} (se esperaban {EXPECTED_PER_CLASS})")

    # 2. Vacíos y duplicados exactos (ignorando mayúsculas, acentos y signos)
    seen = {}
    for i, r in enumerate(rows, start=2):
        msg = (r["message"] or "").strip()
        if not msg:
            errors.append(f"Línea {i}: mensaje vacío")
            continue
        key = " ".join(normalize(msg))
        if key in seen:
            errors.append(f"Duplicado exacto: líneas {seen[key]} y {i}")
        seen[key] = i

    # 3. Casi duplicados dentro del dataset
    words = [content_words(r["message"]) for r in rows]
    for (i, a), (j, b) in combinations(enumerate(words), 2):
        score = jaccard(a, b)
        if score >= NEAR_DUP_THRESHOLD:
            errors.append(
                f"Casi duplicado ({score:.2f}): {rows[i]['message']!r} / {rows[j]['message']!r}"
            )

    # 4. Frases reservadas para pruebas (benchmark + diapositivas)
    reserved = list(RESERVED)
    if BENCH.exists():
        reserved += [c["message"] for c in json.loads(BENCH.read_text(encoding="utf-8"))["cases"]]
    for phrase in reserved:
        pw = content_words(phrase)
        for r, w in zip(rows, words):
            score = jaccard(pw, w)
            if score >= NEAR_DUP_THRESHOLD:
                errors.append(f"Frase reservada en el dataset ({score:.2f}): {r['message']!r}")

    print(f"Frases reservadas revisadas: {len(reserved)}")
    if errors:
        print(f"\nFALLÓ ({len(errors)} problemas):")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("\nOK: dataset listo para el split 160/40.")


if __name__ == "__main__":
    main()
