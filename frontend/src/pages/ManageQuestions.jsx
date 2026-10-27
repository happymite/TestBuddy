
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { addQuestion,deleteQuestion, getExamForOwner, publishExam } from "../api/teacher.js";

const LETTERS = ["A", "B", "C", "D"];

const IMAGE_FIELDS = [
  { name: "question_image", label: "Question image" },
  { name: "option_a_image", label: "Option A image" },
  { name: "option_b_image", label: "Option B image" },
  { name: "option_c_image", label: "Option C image" },
  { name: "option_d_image", label: "Option D image" },
];

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const EMPTY_FORM = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "",
  marks: "1",
};

const EMPTY_IMAGES = {
  question_image: null,
  option_a_image: null,
  option_b_image: null,
  option_c_image: null,
  option_d_image: null,
};

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function ImagePreview({ src, alt }) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      style={{
        display: "block",
        maxWidth: "100%",
        maxHeight: "220px",
        objectFit: "contain",
        marginTop: "8px",
      }}
    />
  );
}

function LocalImagePreview({ file, alt }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); // frees the memory
  }, [file]);

  return <ImagePreview src={url} alt={alt} />;
}

export default function ManageQuestions() {
  const { examId } = useParams();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState(EMPTY_IMAGES);
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
// with the other useState lines
const [fileInputKey, setFileInputKey] = useState(0);
  
useEffect(() => {
    let cancelled = false;

    getExamForOwner(examId)
      .then((data) => {
        if (cancelled) return;
        setExam(data.exam);
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [examId, reloadKey]);

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  function retry() {
    setLoadError("");
    setLoading(true);
    refresh();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleImageChange(event) {
    const { name, files } = event.target;
    const file = files?.[0] ?? null;

    setFormError("");

    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setFormError("Use a JPEG, PNG, or WebP image.");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setFormError("Each image must be 5 MB or smaller.");
        event.target.value = "";
        return;
      }
    }

    setImages((current) => ({
      ...current,
      [name]: file,
    }));
  }

  function validateForm() {
    if (!form.question_text.trim()) return "Enter the question text.";

    for (const letter of LETTERS) {
  const lower = letter.toLowerCase();
  const hasText = form[`option_${lower}`].trim() !== "";
  const hasImage = Boolean(images[`option_${lower}_image`]);

  if (!hasText && !hasImage) {
    return `Option ${letter} needs text, an image, or both.`;
  }
}

    if (!form.correct_option) return "Choose the correct option.";

    const marks = Number(form.marks);
    if (!Number.isSafeInteger(marks) || marks < 1) {
      return "Marks must be a whole number of at least 1.";
    }

    return "";
  }

  async function handleAdd(event) {
    event.preventDefault();

    const problem = validateForm();
    if (problem) {
      setFormError(problem);
      return;
    }

    setFormError("");
    setAdding(true);

    const nextOrder =
      questions.reduce((max, q) => Math.max(max, q.question_order), 0) + 1;

    try {
      await addQuestion(examId, {
        question_text: form.question_text.trim(),
        option_a: form.option_a.trim(),
        option_b: form.option_b.trim(),
        option_c: form.option_c.trim(),
        option_d: form.option_d.trim(),
        correct_option: form.correct_option,
        marks: Number(form.marks),
        question_order: nextOrder,
        ...images,
      });

      setForm({ ...EMPTY_FORM, marks: form.marks });
      setImages(EMPTY_IMAGES);
      setFileInputKey((k) => k + 1);
      refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteQuestion(question) {
  const confirmed = window.confirm(
    `Delete question "${question.question_text}"?\n\nThis action cannot be undone.`,
  );

  if (!confirmed) return;

  try {
    await deleteQuestion(examId, question.id);
    refresh();
  } catch (err) {
    window.alert(err.message);
  }
}


  


  async function handlePublish() {
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    const ok = window.confirm(
      `Publish "${exam.title}"?\n\n` +
        `${questions.length} question(s), ${totalMarks} marks in total.\n\n` +
        "This is permanent. You cannot edit questions or unpublish. " +
        "Students will see the exam immediately.",
    );

    if (!ok) return;

    setPublishError("");
    setPublishing(true);

    try {
      await publishExam(examId);
      refresh();
    } catch (err) {
      setPublishError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <p>Loading exam...</p>;

  if (loadError) {
    return (
      <div>
        <p className="error" role="alert">
          {loadError}
        </p>
        <button onClick={retry}>Try again</button>{" "}
        <Link to="/teacher">Back to my exams</Link>
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div>
      <p>
        <Link to="/teacher">Back to my exams</Link>
      </p>

      <h1>
        {exam.title}
        <span className={`badge${exam.is_published ? " published" : ""}`}>
          {exam.is_published ? "Published" : "Draft"}
        </span>
      </h1>

      {exam.description && <p className="exam-desc">{exam.description}</p>}

      <ul className="exam-meta">
        <li>{exam.duration_minutes} minutes</li>
        <li>
          {questions.length} {questions.length === 1 ? "question" : "questions"}
        </li>
        <li>{totalMarks} marks</li>
        {exam.starts_at && <li>Opens {formatDate(exam.starts_at)}</li>}
        {exam.ends_at && <li>Closes {formatDate(exam.ends_at)}</li>}
      </ul>

      <h2>Questions</h2>
      {questions.length === 0 && <p>No questions yet.</p>}

      <ol className="q-list">
  {questions.map((q) => (
    <li key={q.id} className="q-item">
     <p>{q.question_text}</p>
<ImagePreview src={q.question_image_url} alt="Question image" />

      <ul className="q-opts">
        {LETTERS.map((letter) => {
          const option = letter.toLowerCase();

          return (
            <li
              key={letter}
              className={q.correct_option === letter ? "correct" : ""}
            >
              {letter}. {q[`option_${option}`]}
              {q.correct_option === letter && " ✓"}

              <ImagePreview
                src={q[`option_${option}_image_url`]}
                alt={`Option ${letter} image`}
              />
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="button-danger"
        style={{ marginTop: "8px" }}
        onClick={() => handleDeleteQuestion(q)}
      >
        Delete question
      </button>
    </li>
  ))}
</ol>
      {!exam.is_published && (
        <>
          <form className="form-card" onSubmit={handleAdd}>
            <h2>Add a question</h2>

            <p className="hint">
              You cannot edit or delete a question after adding it. Check it
              before you click Add. Images are optional, up to 5 MB each.
            </p>

            <div className="field">
              <label htmlFor="question_text">Question</label>
              <textarea
                id="question_text"
                name="question_text"
                rows={3}
                value={form.question_text}
                onChange={handleChange}
              />
            </div>

            {IMAGE_FIELDS.map(({ name, label }) => (
              <div className="field" key={name}>
                <label htmlFor={name}>{label} (optional)</label>
              <input
  key={`${name}-${fileInputKey}`}
  id={name}
                  name={name}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />

               <LocalImagePreview file={images[name]} alt={`${label} preview`} />
                {images[name] && (
                  <button
                    type="button"
                    onClick={() => {
                      setImages((current) => ({
                        ...current,
                        [name]: null,
                      }));
                      const input = document.getElementById(name);
                      if (input) input.value = "";
                    }}
                  >
                    Remove image
                  </button>
                )}
              </div>
            ))}

            {LETTERS.map((letter) => {
              const name = `option_${letter.toLowerCase()}`;

              return (
                <div className="field" key={letter}>
                  <label htmlFor={name}>Option {letter}</label>
                  <input
                    id={name}
                    name={name}
                    type="text"
                    value={form[name]}
                    onChange={handleChange}
                  />
                </div>
              );
            })}

            <fieldset className="correct-picker">
              <legend>Correct option</legend>
              {LETTERS.map((letter) => (
                <label key={letter}>
                  <input
                    type="radio"
                    name="correct_option"
                    value={letter}
                    checked={form.correct_option === letter}
                    onChange={handleChange}
                  />{" "}
                  {letter}
                </label>
              ))}
            </fieldset>

            <div className="field">
              <label htmlFor="marks">Marks</label>
              <input
                id="marks"
                name="marks"
                type="number"
                min="1"
                step="1"
                value={form.marks}
                onChange={handleChange}
              />
            </div>

            {formError && (
              <p className="error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add question"}
            </button>
          </form>

          <div className="form-card">
            <h2>Publish</h2>

            {questions.length === 0 ? (
              <p className="hint">Add at least one question to publish.</p>
            ) : (
              <p className="hint">
                Publishing is permanent and makes the exam visible to students.
              </p>
            )}

            {publishError && (
              <p className="error" role="alert">
                {publishError}
              </p>
            )}

            <button
              onClick={handlePublish}
              disabled={publishing || questions.length === 0}
            >
              {publishing ? "Publishing..." : "Publish exam"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

