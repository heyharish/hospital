"""
explainability.py

Provides SHAP-based explanations for the trained XGBoost pipeline.

Why this approach:
- The pipeline is Preprocessor (ColumnTransformer) -> XGBoost.
- SHAP's TreeExplainer works on the raw XGBoost model, which sees the
  ENCODED features (e.g. one-hot columns like "age_[70-80)"), not the
  original human-readable columns (e.g. "age").
- To produce explanations a hospital staff member can actually read,
  we map the encoded SHAP values back to the original feature names
  by summing the contributions of every encoded column that came from
  the same original column.

This mapping is built directly from the fitted ColumnTransformer's
structure (not by parsing strings), so it stays correct even if
column/category names contain underscores or brackets.
"""

import numpy as np
import pandas as pd
import shap


def _build_feature_group_map(preprocessor):
    """
    Returns a list of original feature names, one per encoded output
    column, in the exact order the encoded columns appear.

    Example:
      ['time_in_hospital', 'n_lab_procedures', ..., 'age', 'age', 'age',
       'age', 'age', 'age', 'medical_specialty', ...]
    """
    group_map = []

    for name, transformer, columns in preprocessor.transformers_:
        if name == "num":
            # One encoded output column per original numeric column, in order.
            group_map.extend(columns)

        elif name == "cat":
            # OneHotEncoder produces len(categories_[i]) output columns
            # for the i-th input column, in the same order as `columns`.
            for col, categories in zip(columns, transformer.categories_):
                group_map.extend([col] * len(categories))

    return group_map


class ReadmissionExplainer:
    def __init__(self, pipeline):
        self.pipeline = pipeline
        self.preprocessor = pipeline.named_steps["preprocessor"]
        self.model = pipeline.named_steps["model"]

        # TreeExplainer is the correct, exact SHAP method for tree-based
        # models like XGBoost (as opposed to KernelExplainer, which is a
        # slow approximation meant for black-box models).
        self.explainer = shap.TreeExplainer(self.model)
        self.feature_groups = _build_feature_group_map(self.preprocessor)

    def explain(self, input_df: pd.DataFrame, top_n: int = 5):
        """
        input_df: a single-row (or multi-row) DataFrame with the raw,
        unencoded feature columns (same shape the pipeline expects).

        Returns a list of {"feature": ..., "impact": ...} dicts for the
        top_n contributing factors, sorted by absolute SHAP impact,
        for the FIRST row in input_df.
        """
        encoded = self.preprocessor.transform(input_df)

        # OneHotEncoder output may be sparse; SHAP needs a dense array.
        if hasattr(encoded, "toarray"):
            encoded = encoded.toarray()

        shap_values = self.explainer.shap_values(encoded)

        # shap_values shape: (n_samples, n_encoded_features)
        row_shap = shap_values[0]

        # Aggregate encoded-column SHAP values back to original features.
        contributions = {}
        for value, original_feature in zip(row_shap, self.feature_groups):
            contributions[original_feature] = contributions.get(original_feature, 0.0) + value

        # Sort by absolute impact, take top_n.
        sorted_features = sorted(
            contributions.items(), key=lambda x: abs(x[1]), reverse=True
        )[:top_n]

        return [
            {"feature": feature, "impact": round(float(impact), 4)}
            for feature, impact in sorted_features
        ]
