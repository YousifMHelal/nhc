# خارطة تبني الذكاء الاصطناعي — نظام إدارة علاقات العملاء NHC
## AI Adoption Roadmap — NHC CRM
*Task 2.2.10 · Phase 2 of 3*

---

## 1. مصفوفة الأولوية (Impact × Feasibility Matrix)

```
التأثير التجاري
  │
  │  عالٍ جداً  ┌─────────────────────────────────────────────────────┐
  │             │                              ★ UC-01 Lead Scoring    │
  │             │                                                      │
  │  عالٍ       │                  ◆ UC-02 Close Prediction            │
  │             │                                                      │
  │  متوسط–     │       ◆ UC-06 Churn    ◆ UC-03 Behaviour    ◆ UC-07 Seg │
  │  عالٍ       │                         ◆ UC-08 Property Rec.        │
  │             │                                                      │
  │  متوسط      │  ◆ UC-04 Svc Rec.   ◆ UC-05 Next Best Action        │
  │             └─────────────────────────────────────────────────────┘
  │              منخفضة جداً    منخفضة    متوسطة     عالية     عالية جداً
  │                                     ←── الجدوى الحالية ──→
```

**قراءة المصفوفة:** كل محور مقسوم على خمس درجات. الموضع النسبي يعكس:
- **التأثير:** قيمة الإيراد المحتملة + توفير الوقت + تحسين معدل التحويل.
- **الجدوى الحالية:** توفر البيانات + تعقيد النمذجة + جاهزية التكامل مع الـ UI الحالي.

---

## 2. المراحل الثلاث للتبني

### المرحلة الأولى — البنية التحتية + الطيار (الشهر 1–3)

**الهدف:** نموذج واحد في الإنتاج بنتيجة قابلة للقياس.

| المهمة | التفاصيل |
|--------|----------|
| **UC-01 Lead Scoring (الطيار)** | تدريب offline بـ Python → تصدير الأوزان كـ JSON → تكامل TypeScript client-side |
| بنية تحتية للبيانات (الحد الأدنى) | تجميع سجلات التفاعل + مخرجات الـ leads (Closed Won / Lost) في جدول واحد |
| لوحة متابعة أداء النموذج | إضافة widget بسيط في Analytics يعرض توزيع النقاط + أعلى 10 leads |
| توثيق الميزات (Feature Registry) | `pilot/lead-scoring/model.json` يصبح مرجع الميزات لجميع النماذج اللاحقة |

**التقنيات:** Python (scikit-learn) offline · TypeScript client-side scorer · JSON feature store  
**مقاييس النجاح:** AUC ≥ 0.75 · precision@10 ≥ 60% · وقت التسجيل < 50ms client-side

---

### المرحلة الثانية — التوسع والتخصيص (الشهر 4–9)

**الهدف:** تغطية دورة المبيعات بالكامل + تخصيص التسويق.

| المهمة | التفاصيل |
|--------|----------|
| **UC-02 Opportunity Close Prediction** | بعد 3 أشهر من بيانات UC-01، تدريب نموذج احتمالية إغلاق الفرص. يحتاج `daysInStage`, `interactionVelocity`, `repPerformance` |
| **UC-07 Auto-Segmentation** | K-Means (k=4–6) على `budget × propertyInterest × city × interactionRecency`. يُغذي بيانات الجمهور في Campaign Builder |
| **UC-08 Property Recommendation** | قاعدة بيانات مطابقة بسيطة: embedding للعميل × catalogue الوحدات → cosine similarity |
| Feature Store موسّع | إضافة `daysInStage`, `interactionVelocity`, `repConversionRate`, `campaignResponseHistory` |

**التقنيات:** Python offline (scikit-learn + faiss للـ similarity) · JSON feature store · TypeScript integration  
**مقاييس النجاح:** دقة Close Prediction AUC ≥ 0.70 · نسبة تحويل الحملات المخصصة +20% vs baseline

---

### المرحلة الثالثة — الذكاء التشغيلي (الشهر 10–18)

**الهدف:** ذكاء استباقي في كل لحظة تفاعل.

| المهمة | التفاصيل |
|--------|----------|
| **UC-03 Customer Behaviour Analysis** | HDBSCAN clustering على بيانات التفاعل الكاملة + تحليل دورة شراء (3–18 شهراً في العقارات) |
| **UC-05 Next Best Action** | Multi-armed bandit أو قواعد تدريجية بناءً على استجابة القنوات التاريخية |
| **UC-06 Churn Prediction** | Survival analysis (Kaplan-Meier / Cox) على فترات الصمت بين التفاعلات |
| **UC-04 Service Recommendation** | AraBERT أو CAMeL-BERT لتصنيف التذاكر + قاعدة معرفة حلول من بيانات RCA |

**التقنيات:** Python ML pipeline · AraBERT (NLP) · Edge inference (ONNX.js) للـ NLP client-side  
**مقاييس النجاح:** Churn recall ≥ 0.65 · FCR (First Contact Resolution) +15% · NPS قابل للقياس

---

## 3. متطلبات البيانات والبنية التحتية لكل حالة استخدام

### UC-01 — Lead Scoring (المرحلة 1)

| البُعد | التفاصيل |
|--------|----------|
| **مصادر البيانات** | `leads` table · `interactions` table · نتائج الـ pipeline (Closed Won/Lost) |
| **Pipeline البيانات** | استخراج offline → Python pandas → تدريب → تصدير `model.json` |
| **نوع النموذج** | Logistic Regression (baseline) أو LightGBM (production) |
| **طريقة التقديم (Serving)** | JSON coefficients + TypeScript scorer · client-side · بدون server |
| **إعادة التدريب** | شهري (manual trigger في البداية) → تلقائي بعد 100 lead جديد |
| **المراقبة** | Feature drift (PSI) · Score distribution shift · Precision@10 tracking |
| **الميزات (Features)** | source_score · channel_score · budget_ratio · recency_days · interaction_count · city_tier · property_type_match |

---

### UC-02 — Opportunity Close Prediction (المرحلة 2)

| البُعد | التفاصيل |
|--------|----------|
| **مصادر البيانات** | `opportunities` · `interactions` · `pipeline_history` (تحتاج جمع) · `sales_reps` |
| **Pipeline البيانات** | Snapshot يومي لحالة كل فرصة → تسلسل زمني → feature engineering |
| **نوع النموذج** | Gradient Boosting (XGBoost/LightGBM) مع SHAP للقابلية للتفسير |
| **طريقة التقديم** | JSON model + TypeScript client-side (نفس نمط Lead Scoring) |
| **إعادة التدريب** | أسبوعي بعد توفر 50+ فرصة مغلقة |
| **المراقبة** | Calibration curve · Brier score · Pipeline coverage |
| **الميزات** | days_in_stage · stage_velocity · deal_value_zscore · rep_win_rate · interaction_recency · proposal_sent_flag |

---

### UC-03 — Customer Behaviour Analysis (المرحلة 3)

| البُعد | التفاصيل |
|--------|----------|
| **مصادر البيانات** | `interactions` · `timeline_events` · `campaigns` engagement · `contracts` |
| **Pipeline البيانات** | Aggregation window (30/60/90 يوم) → vector representation لكل عميل |
| **نوع النموذج** | HDBSCAN clustering · PCA للتصور · Silhouette score للتحقق |
| **طريقة التقديم** | Cluster labels مدمجة في `Customer` entity → filters في Campaign Builder |
| **إعادة التدريب** | ربع سنوي أو عند دخول 200+ عميل جديد |
| **المراقبة** | Cluster stability · Davies-Bouldin index |
| **الميزات** | interaction_frequency · channel_preference · property_interest_entropy · budget_range · recency · response_rate |

---

### UC-04 — Service Recommendation Engine (المرحلة 3)

| البُعد | التفاصيل |
|--------|----------|
| **مصادر البيانات** | `tickets` · `requests` · RCA notes · resolution history |
| **Pipeline البيانات** | Arabic NLP preprocessing → TF-IDF أو AraBERT embeddings → similarity matching |
| **نوع النموذج** | Retrieval-augmented (BM25 + re-ranking) · أو fine-tuned AraBERT |
| **طريقة التقديم** | API endpoint (إذا توفر backend) أو ONNX.js للـ in-browser inference |
| **إعادة التدريب** | بعد كل 500 تذكرة محلولة مع label جديد |
| **المراقبة** | Acceptance rate · Time-to-resolution · L1→L2 escalation rate |
| **الميزات** | ticket_text_embedding · customer_segment · previous_resolutions · rep_expertise |

---

### UC-07 — Auto-Segmentation (المرحلة 2)

| البُعد | التفاصيل |
|--------|----------|
| **مصادر البيانات** | `customers` · `leads` · `interactions` |
| **Pipeline البيانات** | Feature matrix → StandardScaler → K-Means |
| **نوع النموذج** | K-Means (k=4–6) · Elbow method لتحديد k |
| **طريقة التقديم** | Segment labels في `Customer.segment` field |
| **إعادة التدريب** | شهري |
| **المراقبة** | Inertia · Silhouette coefficient |

---

### UC-08 — Property Recommendation (المرحلة 2)

| البُعد | التفاصيل |
|--------|----------|
| **مصادر البيانات** | `customers` profile · `opportunities` history · unit catalogue |
| **Pipeline البيانات** | User vector × Item vector → cosine similarity → top-k |
| **نوع النموذج** | Collaborative filtering (SVD) أو Content-based (TF-IDF على unit features) |
| **طريقة التقديم** | JSON recommendation list في Customer 360 sidebar |
| **إعادة التدريب** | عند إضافة وحدات جديدة لكاتالوج المشاريع |
| **المراقبة** | Click-through rate على التوصيات · Conversion rate من توصية |

---

## 4. البنية التحتية المطلوبة — إجمالي المراحل الثلاث

```
المرحلة 1 (الحد الأدنى)
┌─────────────────────────────────────────────────────────────┐
│  Python offline training script                             │
│  ├── scikit-learn / LightGBM                                │
│  ├── pandas + numpy (feature engineering)                   │
│  └── JSON export (coefficients + feature metadata)          │
│                                                             │
│  TypeScript client-side scorer                              │
│  ├── src/lib/ai/leadScore.ts                                │
│  └── pilot/lead-scoring/model.json                          │
└─────────────────────────────────────────────────────────────┘

المرحلة 2 (إضافة)
┌─────────────────────────────────────────────────────────────┐
│  Feature store (JSON-based, version-controlled)             │
│  ├── features/v1/lead-scoring.json                          │
│  ├── features/v2/close-prediction.json                      │
│  └── features/v1/segmentation.json                          │
│                                                             │
│  Evaluation harness                                         │
│  └── pilot/eval/metrics.py (AUC, precision@k, confusion)    │
└─────────────────────────────────────────────────────────────┘

المرحلة 3 (اختياري لهذا العرض التجريبي)
┌─────────────────────────────────────────────────────────────┐
│  NLP pipeline: AraBERT / CAMeL-BERT (Hugging Face)          │
│  ONNX.js للـ in-browser inference                           │
│  A/B testing framework (LaunchDarkly أو feature flags)      │
│  MLOps: DVC للـ data versioning + MLflow للـ experiment     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. جدول زمني مرئي

```
الشهر:    1    2    3    4    5    6    7    8    9   10   11   12
          │────│────│────│────│────│────│────│────│────│────│────│

UC-01    ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Lead     [تدريب][تكامل UI][قياس][────── تحسين مستمر ──────────]
Scoring

UC-07              ░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Segments               [بيانات][نمذجة][تكامل حملات]

UC-02                       ░░░░░░░░░████████████░░░░░░░░░░░░░░
Close Pred.                          [بيانات][نموذج][UI]

UC-08                              ░░░░░░░░████████░░░░░░░░░░░░
Property Rec.                              [catalogue][تكامل]

UC-03                                             ░░░░████████
Behaviour                                              [تجريبي]

UC-05                                                  ░░░████
Next Best                                                  [v1]

█ تنفيذ فعلي  ░ تحضير/بيانات
```

---

## 6. مبادئ تنفيذ مشتركة

1. **القابلية للتفسير أولاً:** كل نموذج يُخرج أعلى 3 عوامل تؤثر على النتيجة — لا "صندوق أسود".
2. **لا backend مطلوب للعرض التجريبي:** جميع نماذج المرحلة 1 و 2 تعمل client-side عبر JSON weights.
3. **الإنسان في الحلقة:** النماذج تقترح، المندوب يقرر — لا أتمتة كاملة دون مراجعة.
4. **خصوصية البيانات:** لا PII يُرسل لخوارزمية خارجية في المرحلة الحالية — كل المعالجة محلية.
5. **التدهور الأنيق (Graceful Degradation):** إذا فشل تحميل model.json، تُعاد النقاط من `lead.aiScore` المخزن مسبقاً.

---

*المرحلة التالية: تنفيذ الطيار — [03-pilot-impact.md](./03-pilot-impact.md) (يُكتمل بعد بناء الطيار)*
