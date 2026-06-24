import clsx from 'clsx';

/* ==========================================================================
   ✨ COMPONENT: NeonSweepButton
   --------------------------------------------------------------------------
   A highly stylized, animated button component that features a sleek
   sweeping background animation on hover. It uses clean CSS variables
   and classes to match the system theme perfectly.
   ========================================================================== */
export default function NeonSweepButton({
  tone = 'cyan',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx('neon-btn', `neon-btn-${size}`, `neon-btn-${tone}`, className)}
      {...props}
    >
      {/* Background sweep animation layer */}
      <span className="neon-btn-sweep" />
      {/* Content wrapper */}
      <span className="neon-btn-content">{children}</span>
    </button>
  );
}

