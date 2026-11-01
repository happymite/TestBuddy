export default function TeacherSubjectsSection({
  newSubjectName,
  setNewSubjectName,
  addingSubject,
  subjectError,
  onAddSubject,
}) {
  return (
    <section className="subjects-section">
      <h2 className="subjects-heading">Subjects</h2>
      <form className="subject-add-form" onSubmit={onAddSubject}>
        <input
          id="new-subject-name"
          type="text"
          placeholder="New subject name…"
          maxLength={100}
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
        />
        <button type="submit" disabled={addingSubject || !newSubjectName.trim()}>
          {addingSubject ? "Adding…" : "Add subject"}
        </button>
      </form>
      {subjectError && <p className="error" role="alert">{subjectError}</p>}
    </section>
  );
}

