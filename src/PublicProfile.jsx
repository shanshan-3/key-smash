import useProfileDashboard from "./useProfileDashboard.js";
import ProfileLedger from "./ProfileLedger.jsx";

export default function PublicProfile({ handle, onBack, onRace }) {
  const { state, retry } = useProfileDashboard(handle);

  return (
    <div className="public-profile">
      <div className="page-heading profile-masthead">
        <div>
          <p className="profile-kicker">KEYSMASH / Performance ledger</p>
          <h1 tabIndex={-1}>
            {state.profile ? `@${state.profile.handle}` : "Public profile."}
          </h1>
        </div>
        <button className="brutal-btn" onClick={onBack}>
          Start typing
        </button>
      </div>
      {state.loading ? (
        <p className="state-panel" role="status">
          Loading profile...
        </p>
      ) : state.error ? (
        <section className="state-panel" role="alert">
          <h2>Profile could not load.</h2>
          <p>Check your connection and try again.</p>
          <button className="brutal-btn" onClick={retry}>
            Retry profile
          </button>
        </section>
      ) : !state.profile ? (
        <section className="state-panel">
          <h2>Profile not found.</h2>
          <p>This public profile is unavailable.</p>
        </section>
      ) : (
        <ProfileLedger
          profile={state.profile}
          onRace={(mode) => onRace(state.profile.handle, mode)}
        />
      )}
    </div>
  );
}
