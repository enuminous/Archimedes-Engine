import Mathlib

namespace Archimedes
open Finset

def project (a b x : ℝ) : ℝ := min b (max a x)

theorem project_mem (a b x : ℝ) (h : a ≤ b) :
    a ≤ project a b x ∧ project a b x ≤ b :=
  ⟨le_min h (le_max_left _ _), min_le_left _ _⟩

theorem convex_update_mem (m y g : ℝ) (hm : m ∈ Set.Icc 0 1)
    (hy : y ∈ Set.Icc 0 1) (hg : g ∈ Set.Icc 0 1) :
    m + g * (y - m) ∈ Set.Icc 0 1 := by
  have h0 := add_nonneg (mul_nonneg (sub_nonneg.mpr hg.2) hm.1) (mul_nonneg hg.1 hy.1)
  have h1 := add_le_add (mul_le_mul_of_nonneg_left hm.2 (sub_nonneg.mpr hg.2))
    (mul_le_mul_of_nonneg_left hy.2 hg.1)
  constructor <;> nlinarith

theorem gain_mem (α dt : ℝ) (hα : 0 ≤ α) (hdt : 0 ≤ dt) :
    1 - Real.exp (-α * dt) ∈ Set.Icc 0 1 := by
  have he : Real.exp (-α * dt) ≤ 1 := Real.exp_le_one_iff.mpr (by nlinarith)
  constructor <;> linarith [Real.exp_pos (-α * dt)]

variable {E : Type*} [NormedAddCommGroup E]

noncomputable def coherence (ε : ℝ) (x m : E) : ℝ :=
  1 - ‖x - m‖ / (‖x‖ + ‖m‖ + ε)

theorem coherence_mem (ε : ℝ) (hε : 0 < ε) (x m : E) :
    coherence ε x m ∈ Set.Icc 0 1 := by
  have hd : 0 < ‖x‖ + ‖m‖ + ε := by positivity
  have h0 := div_nonneg (norm_nonneg (x - m)) hd.le
  have h1 : ‖x - m‖ / (‖x‖ + ‖m‖ + ε) ≤ 1 := by
    apply (div_le_one hd).mpr
    linarith [norm_sub_le x m]
  unfold coherence
  constructor <;> linarith

theorem coherence_eq_one_iff (ε : ℝ) (hε : 0 < ε) (x m : E) :
    coherence ε x m = 1 ↔ x = m := by
  have hd : ‖x‖ + ‖m‖ + ε ≠ 0 := ne_of_gt (by positivity)
  simp [coherence, sub_eq_self, div_eq_zero_iff, hd, norm_eq_zero, sub_eq_zero]

variable {H : Type*} [NormedAddCommGroup H] [InnerProductSpace ℝ H]

theorem alignment_bound (ε : ℝ) (hε : 0 < ε) (x y : H) :
    |inner ℝ x y / (‖x‖ * ‖y‖ + ε)| ≤ 1 := by
  have hd : 0 < ‖x‖ * ‖y‖ + ε := by positivity
  rw [abs_div, abs_of_pos hd]
  apply (div_le_one hd).mpr
  linarith [abs_real_inner_le_norm x y]

theorem signed_residual_lower (a b R : ℝ) (hR : |R| ≤ 1) :
    -(0.06 : ℝ) ≤ a ^ 2 + 0.02 * b ^ 2 - 0.06 * R := by
  have h := (abs_le.mp hR).2
  nlinarith [sq_nonneg a, sq_nonneg b]

theorem stencil2D_nonnegative (d c left right up down : ℝ)
    (hd : d ∈ Set.Icc 0 1) (hc : 0 ≤ c) (hl : 0 ≤ left)
    (hr : 0 ≤ right) (hu : 0 ≤ up) (hb : 0 ≤ down) :
    0 ≤ c + 0.1 * (d * (left + right + up + down - 4*c) - 0.055*c) := by
  have hcoef : 0 ≤ 1 - 0.1 * (4*d + 0.055) := by linarith [hd.2]
  have hprod := mul_nonneg hcoef hc
  have hrest := mul_nonneg (mul_nonneg (by norm_num : (0:ℝ) ≤ 0.1) hd.1)
    (by linarith : 0 ≤ left + right + up + down)
  nlinarith

/-- Cancellation of a symmetric finite diffusion stencil, including reflecting boundaries. -/
theorem total_flux_zero {ι : Type*} [Fintype ι] (w : ι → ι → ℝ)
    (hw : ∀ i j, w i j = w j i) (F : ι → ℝ) :
    (∑ i, ∑ j, w i j * (F j - F i)) = 0 := by
  simp_rw [mul_sub, sum_sub_distrib]
  suffices h : (∑ i, ∑ j, w i j * F j) = ∑ i, ∑ j, w i j * F i by linarith
  rw [sum_comm]
  apply sum_congr rfl
  intro i _
  apply sum_congr rfl
  intro j _
  rw [hw j i]

theorem source_free_mass_step {ι : Type*} [Fintype ι]
    (F lap : ι → ℝ) (dt d μ : ℝ) (hflux : ∑ i, lap i = 0) :
    (∑ i, (F i + dt * (d * lap i - μ * F i))) =
      (1 - dt * μ) * ∑ i, F i := by
  simp only [sum_add_distrib, mul_sub, sum_sub_distrib, ← mul_sum, hflux, mul_zero]
  ring

def accumulated (dt I₀ : ℝ) (C : ℕ → ℝ) : ℕ → ℝ
  | 0 => I₀
  | n + 1 => accumulated dt I₀ C n + dt * C n

theorem accumulation_lower (dt I₀ c : ℝ) (C : ℕ → ℝ) (hdt : 0 ≤ dt)
    (hC : ∀ n, c ≤ C n) (n : ℕ) : I₀ + n * dt * c ≤ accumulated dt I₀ C n := by
  induction n with
  | zero => simp [accumulated]
  | succ n ih =>
    rw [accumulated]
    push_cast
    have h := mul_le_mul_of_nonneg_left (hC n) hdt
    nlinarith

def plannerNodes (depth width : ℕ) : ℕ := 4 + 4 * width * (depth - 1)
theorem planner_default : plannerNodes 3 3 = 28 := by decide +kernel
theorem planner_maximum (d b : ℕ) (hd : d ≤ 4) (hb : b ≤ 4) : plannerNodes d b ≤ 52 := by
  unfold plannerNodes
  have h := Nat.mul_le_mul hb (show d - 1 ≤ 3 by omega)
  omega

end Archimedes
