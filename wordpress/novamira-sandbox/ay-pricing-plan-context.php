<?php
/**
 * Preserve pricing package context on the AI Visibility Snapshot form.
 * Loaded through Novamira sandbox so the child theme remains untouched.
 */

if (!defined('ABSPATH')) {
    exit;
}

function ay_plan_context_labels(): array {
    return [
        'diagnostic' => 'AI Visibility Diagnostic Audit ($499)',
        'sprint' => '90-Day AI Search Visibility Sprint (from $2,500/mo)',
        'growth' => 'Monthly AI Visibility Growth',
    ];
}

function ay_plan_context_label(string $plan): string {
    $labels = ay_plan_context_labels();
    return $labels[$plan] ?? $plan;
}

add_action('wp_footer', function () {
    if (!is_page('ai-visibility-audit')) {
        return;
    }

    $labels = ay_plan_context_labels();
    ?>
    <script>
    (() => {
      const params = new URLSearchParams(window.location.search);
      const plan = (params.get('plan') || params.get('package') || '').trim().toLowerCase();
      const labels = <?php echo wp_json_encode($labels); ?>;
      const label = labels[plan] || '';
      const form = document.querySelector('form.ay-audit-form');
      if (!form || !plan) return;
      let field = form.querySelector('input[name="ay_plan"]');
      if (!field) {
        field = document.createElement('input');
        field.type = 'hidden';
        field.name = 'ay_plan';
        form.prepend(field);
      }
      field.value = plan;
      let status = document.querySelector('[data-selected-plan]');
      if (!status) {
        status = document.createElement('p');
        status.className = 'ay-selected-plan';
        status.dataset.selectedPlan = '';
        const intro = document.querySelector('.ay-form-intro');
        if (intro) intro.appendChild(status);
      }
      status.hidden = false;
      status.textContent = 'Selected package: ' + (label || plan);
      form.dataset.selectedPlan = plan;
    })();
    </script>
    <?php
}, 25);

add_action('wp_head', function () {
    if (!is_page('ai-visibility-audit')) {
        return;
    }
    ?>
    <style>
      .ay-selected-plan {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin: 14px 0 0;
        padding: 8px 12px;
        border: 1px solid rgba(200, 79, 7, 0.28);
        border-radius: 999px;
        background: rgba(200, 79, 7, 0.09);
        color: #c84f07;
        font-size: 0.92rem;
        font-weight: 800;
        line-height: 1.2;
      }
    </style>
    <?php
}, 20);

add_action('admin_post_nopriv_ay_audit_snapshot', 'ay_plan_context_add_to_submission', 1);
add_action('admin_post_ay_audit_snapshot', 'ay_plan_context_add_to_submission', 1);

function ay_plan_context_add_to_submission(): void {
    $plan = sanitize_key(wp_unslash($_POST['ay_plan'] ?? ''));
    if (!$plan) {
        return;
    }

    $label = ay_plan_context_label($plan);
    $_POST['ay_notes'] = trim("Selected pricing package: {$label}\n" . wp_unslash($_POST['ay_notes'] ?? ''));
}
