import { useState, useEffect } from "react";

const LETTERS = ["A", "B", "C", "D"];
const IMAGE_FIELDS = [
  { name: "question_image", label: "Question image" },
  { name: "option_a_image", label: "Option A image" },
  { name: "option_b_image", label: "Option B image" },
  { name: "option_c_image", label: "Option C image" },
  { name: "option_d_image", label: "Option D image" },
];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
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

function LocalPreview({ file, alt }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const objUrl = URL.createObjectURL(file);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);
  if (!url) return null;
  return <img src={url} alt={alt} style={{ display: "block", maxHeight: "160px", marginTop: "6px" }} />;
}

export default function QuestionForm({ onAddQuestion, isAdding }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState(EMPTY_IMAGES);
  const [inputKey, setInputKey] = useState(0);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((curr) => ({ ...curr, [name]: value }));
  }

  function handleImageChange(e) {
    const { name, files } = e.target;
    const file = files?.[0] ?? null;
    setError("");
    if (file) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only JPEG, PNG, or WebP allowed.");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Image must be 5 MB or smaller.");
        e.target.value = "";
        return;
      }
    }
    setImages((curr) => ({ ...curr, [name]: file }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.question_text.trim()) return setError("Enter the question prompt.");
    for (const letter of LETTERS) {
      const key = letter.toLowerCase();
      if (!form[`option_${key}`].trim() && !images[`option_${key}_image`]) {
        return setError(`Option ${letter} requires text or an image.`);
      }
    }
    if (!form.correct_option) return setError("Select the correct answer option.");

    setError("");
    try {
      await onAddQuestion(form, images);
      setForm({ ...EMPTY_FORM, marks: form.marks });
      setImages(EMPTY_IMAGES);
      setInputKey((k) => k + 1);
    } catch (err) {
      setError(err.message || "Failed to add question.");
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2>Add a New Question</h2>
      <div className="field">
        <label htmlFor="q_text">Question Prompt</label>
        <textarea id="q_text" name="question_text" rows={3} value={form.question_text} onChange={handleChange} required />
      </div>

      {IMAGE_FIELDS.map(({ name, label }) => (
        <div className="field" key={name}>
          <label htmlFor={name}>{label} (optional)</label>
          <input key={`${name}-${inputKey}`} id={name} name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
          <LocalPreview file={images[name]} alt={`${label} preview`} />
        </div>
      ))}

      {LETTERS.map((letter) => {
        const name = `option_${letter.toLowerCase()}`;
        return (
          <div className="field" key={letter}>
            <label htmlFor={name}>Option {letter}</label>
            <input id={name} name={name} type="text" value={form[name]} onChange={handleChange} />
          </div>
        );
      })}

      <fieldset className="correct-picker">
        <legend>Select Correct Option</legend>
        {LETTERS.map((letter) => (
          <label key={letter} style={{ marginRight: "1rem" }}>
            <input type="radio" name="correct_option" value={letter} checked={form.correct_option === letter} onChange={handleChange} /> {letter}
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="marks">Marks Weightage</label>
        <input id="marks" name="marks" type="number" min="1" value={form.marks} onChange={handleChange} required />
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={isAdding}>
        {isAdding ? "Saving Question..." : "Add Question"}
      </button>
    </form>
  );
}

