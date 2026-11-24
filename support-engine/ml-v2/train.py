"""
Tarea 4 · AI Support Engine V2 — Código 1: separar y entrenar (diapositiva 12)
y Código 2: evaluar y predecir (diapositiva 13), Clase 02.
Autor: José Alberto Herrera Flores

Pipeline: TF-IDF (unigramas y bigramas) + Regresión Logística, entrenado con
ml-v2/tickets.csv (200 tickets, 50 por categoría). Split estratificado 80/20:
160 para entrenamiento y 40 para prueba independiente.

Uso (desde support-engine/):
    pip install -r ml-v2/requirements.txt
    python ml-v2/validate_dataset.py   # quality gate del dataset
    python ml-v2/train.py
"""
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

HERE = Path(__file__).resolve().parent

data = pd.read_csv(HERE / "tickets.csv")

X_train, X_test, y_train, y_test = train_test_split(
    data["message"], data["category"], test_size=0.2,
    stratify=data["category"], random_state=42
)

model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
    ("classifier", LogisticRegression(max_iter=1000))
])

model.fit(X_train, y_train)

# ── Verificación del split (diapositiva 8) ──────────────────────────────────
print(f"Train: {len(X_train)} registros | Test: {len(X_test)} registros")
print(pd.DataFrame({
    "train": y_train.value_counts().sort_index(),
    "test": y_test.value_counts().sort_index(),
}))
print(f"Vocabulario TF-IDF (solo train): {len(model.named_steps['tfidf'].vocabulary_)} términos")
print(f"Clases aprendidas: {list(model.classes_)}")

# ── Código 2 · Evaluar y predecir (diapositiva 13) ──────────────────────────
from sklearn.metrics import classification_report, confusion_matrix

predictions = model.predict(X_test)
print()
print(classification_report(y_test, predictions, zero_division=0))
print(confusion_matrix(
    y_test, predictions, labels=model.classes_
))

new_message = ["Encontré datos de otros clientes"]
category = model.predict(new_message)[0]
confidence = model.predict_proba(new_message).max()
print("Categoría:", category)
print("Score aproximado:", round(confidence, 3))
