import { Check } from "@phosphor-icons/react";
import { GuidePopover } from "./GuideOverlay";
import { plans } from "./demo-data";

function PriceField({ value, onChange, inputRef }) {
  return (
    <label className="price-input">
      <span className="sr-only">Pro plan monthly price</span>
      <span className="price-input__currency">$</span>
      <input
        ref={inputRef}
        value={value}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))}
        aria-label="Pro plan monthly price"
      />
      <span className="price-input__unit">USD</span>
    </label>
  );
}

function PlanRow({ plan, proPrice, setProPrice, inputRef, onEdit }) {
  const isPro = plan.id === "pro";

  return (
    <div className={isPro ? "plan-row plan-row--pro" : "plan-row"}>
      <div className="plan-name-cell">
        <div className="plan-name-line">
          <strong>{plan.name}</strong>
          {isPro && <span className="current-badge">Current</span>}
        </div>
        <span>{plan.description}</span>
      </div>
      <div className="monthly-cell">
        {isPro ? (
          <PriceField value={proPrice} onChange={setProPrice} inputRef={inputRef} />
        ) : (
          <div className="price-input price-input--static">
            <span className="price-input__currency">$</span>
            <span>{plan.monthly.toFixed(2)}</span>
            <span className="price-input__unit">USD</span>
          </div>
        )}
      </div>
      <div className="annual-cell">
        <div className="price-input price-input--static">
          <span className="price-input__currency">$</span>
          <span>{plan.annual.toFixed(2)}</span>
          <span className="price-input__unit">USD</span>
        </div>
      </div>
      <ul className="feature-cell">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check size={14} weight="bold" aria-hidden="true" />{feature}
          </li>
        ))}
      </ul>
      <div className="edit-cell">
        <button
          className="secondary-button secondary-button--small"
          type="button"
          onClick={() => onEdit(plan.name)}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export function DemoPricing({
  assistantOpen,
  mission,
  paused,
  loading,
  onAdvance,
  onHighlight,
  onNewMission,
  proPrice,
  setProPrice,
  proInputRef,
  storageEnabled,
  setStorageEnabled,
  notice,
  setNotice,
  lastUpdated,
}) {
  return (
    <main id="main-content" className="page-content">
      <div id="demo-surface">
        <div className="page-meta">
          <span>Settings</span><span>/</span><strong>Pricing</strong>
        </div>
        <div className="page-heading-row">
          <div>
            <h1>Pricing</h1>
            <p>Manage your plans and pricing. Changes are saved automatically.</p>
          </div>
          <div className="updated-status">
            <span>{lastUpdated}</span>
            <strong><span className="status-dot" aria-hidden="true" />{notice}</strong>
          </div>
        </div>

        <section className="pricing-section" aria-labelledby="plans-title">
          <div className="section-heading">
            <h2 id="plans-title">Plans</h2>
            <p>Update plan names, prices, and features.</p>
          </div>

          <div className="table-head" aria-hidden="true">
            <span>Plan</span>
            <span>Monthly price</span>
            <span>Annual price</span>
            <span>Features</span>
            <span />
          </div>

          <div className="plans-list">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                proPrice={proPrice}
                setProPrice={(value) => {
                  setProPrice(value);
                  setNotice("Pro price edited");
                }}
                inputRef={proInputRef}
                onEdit={(name) => setNotice(name + " plan selected")}
              />
            ))}
          </div>

          {assistantOpen && mission && (
            <GuidePopover
              mission={mission}
              paused={paused}
              loading={loading}
              onAdvance={onAdvance}
              onHighlight={onHighlight}
              onNewMission={onNewMission}
            />
          )}
        </section>

        <section className="addon-section" aria-labelledby="addon-title">
          <div className="section-heading">
            <h2 id="addon-title">Add-on</h2>
            <p>Optional extras for your account.</p>
          </div>
          <div className="addon-row">
            <div>
              <strong>Extra storage</strong>
              <span>100 GB of additional storage.</span>
            </div>
            <div className="addon-price">
              <strong>$10.00</strong><span>/ month</span>
            </div>
            <button
              type="button"
              className={storageEnabled ? "switch is-on" : "switch"}
              role="switch"
              aria-checked={storageEnabled}
              aria-label="Extra storage"
              onClick={() => {
                setStorageEnabled((value) => !value);
                setNotice(storageEnabled
                  ? "Extra storage disabled"
                  : "Extra storage enabled");
              }}
            >
              <span className="switch__thumb" />
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setNotice("Storage settings opened")}
            >
              Manage
            </button>
          </div>
          <div className="page-footer-row">
            <span>All prices are in USD. Taxes may apply.</span>
            <button type="button" onClick={() => setNotice("Billing history opened")}>
              View billing history
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
