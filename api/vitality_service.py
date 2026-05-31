import math


MIN_TRACK_FRAMES = 3
PX_PER_MM = 1500.0
REFERENCE_SPEED_MM_SEC = 0.025
LIVE_MOVING_RATIO_THRESHOLD = 0.1
NORMAL_SPEED_RATIO = 3.0
NORMAL_SPEED_SCORE = 0.60
FAST_SPEED_RATIO = 6.0
FAST_SPEED_SCORE = 0.92


class VitalityService:
    def __init__(
        self,
        min_track_frames=MIN_TRACK_FRAMES,
        motion_threshold_px=2.0,
        px_per_mm=PX_PER_MM,
        reference_speed_mm_sec=REFERENCE_SPEED_MM_SEC,
        live_moving_ratio_threshold=LIVE_MOVING_RATIO_THRESHOLD,
        target_class_name="predator",
        normal_speed_ratio=NORMAL_SPEED_RATIO,
        normal_speed_score=NORMAL_SPEED_SCORE,
        fast_speed_ratio=FAST_SPEED_RATIO,
        fast_speed_score=FAST_SPEED_SCORE,
    ):
        self.min_track_frames = min_track_frames
        self.motion_threshold_px = motion_threshold_px
        self.px_per_mm = px_per_mm
        self.reference_speed_mm_sec = reference_speed_mm_sec
        self.live_moving_ratio_threshold = live_moving_ratio_threshold
        self.target_class_name = target_class_name
        self.normal_speed_ratio = normal_speed_ratio
        self.normal_speed_score = normal_speed_score
        self.fast_speed_ratio = fast_speed_ratio
        self.fast_speed_score = fast_speed_score

    def summarize(self, tracks, frame_count, fps):
        confirmed_tracks = [
            track for track in tracks.values()
            if track["frames_seen"] >= self.min_track_frames
            and track["class_name"] == self.target_class_name
        ]
        observed_seconds = frame_count / fps if fps else 0.0

        summary_rows = [
            self._summarize_track(track, frame_count, fps)
            for track in confirmed_tracks
        ]

        live_tracks = [
            row for row in summary_rows
            if row["is_live_motion"]
        ]
        moving_tracks = [
            row for row in summary_rows
            if row["total_distance_px"] >= self.motion_threshold_px * 2
        ]

        mean_speed_px_sec = (
            sum(row["mean_speed_px_sec"] for row in summary_rows) / len(summary_rows)
            if summary_rows else 0.0
        )
        mean_speed_mm_sec = self._px_to_mm(mean_speed_px_sec)
        moving_ratio = len(moving_tracks) / len(summary_rows) if summary_rows else 0.0
        estimated_live_ratio = len(live_tracks) / len(summary_rows) if summary_rows else 0.0
        observation_stability = (
            sum(row["visibility_ratio"] for row in summary_rows) / len(summary_rows)
            if summary_rows else 0.0
        )
        speed_score = self._speed_score(mean_speed_mm_sec)
        mean_speed_ratio = self._speed_ratio(mean_speed_mm_sec)
        activity_index = speed_score
        vitality_score = max(0.0, min(activity_index * 100.0, 100.0))

        aggregate = {
            "frame_count": frame_count,
            "fps": round(fps, 3),
            "observed_seconds": round(observed_seconds, 3),
            "target_class_name": self.target_class_name,
            "px_per_mm": round(self.px_per_mm, 3),
            "confirmed_tracks": len(summary_rows),
            "moving_tracks": len(moving_tracks),
            "live_tracks": len(live_tracks),
            "mean_speed_px_sec": round(mean_speed_px_sec, 3),
            "mean_speed_mm_sec": round(mean_speed_mm_sec, 4),
            "mean_speed_ratio": round(mean_speed_ratio, 4),
            "speed_score": round(speed_score, 4),
            "moving_ratio": round(moving_ratio, 4),
            "estimated_live_ratio": round(estimated_live_ratio, 4),
            "observation_stability": round(observation_stability, 4),
            "activity_index": round(activity_index, 4),
            "vitality_score": round(vitality_score, 2),
        }

        return summary_rows, aggregate

    def _summarize_track(self, track, frame_count, fps):
        trajectory = track["trajectory"]
        duration_seconds = self._track_duration_seconds(track, fps)
        total_distance_px = track["total_distance_px"]
        total_distance_mm = self._px_to_mm(total_distance_px)
        mean_speed_px_sec = total_distance_px / duration_seconds if duration_seconds else 0.0
        mean_speed_mm_sec = self._px_to_mm(mean_speed_px_sec)
        mean_speed_ratio = self._speed_ratio(mean_speed_mm_sec)
        moving_ratio = track["moving_frames"] / max(len(trajectory) - 1, 1)
        visibility_ratio = track["frames_seen"] / max(frame_count, 1)
        estimated_live_ratio = moving_ratio
        is_live_motion = (
            total_distance_px >= self.motion_threshold_px * 2
            and moving_ratio >= self.live_moving_ratio_threshold
        )
        vitality_score = self._track_vitality_score(
            mean_speed_mm_sec,
            moving_ratio,
            visibility_ratio,
        )

        return {
            "track_id": track["track_id"],
            "class_name": track["class_name"],
            "frames_seen": track["frames_seen"],
            "first_frame_idx": track["first_frame_idx"],
            "last_frame_idx": track["last_frame_idx"],
            "trajectory_points": len(trajectory),
            "total_distance_px": round(total_distance_px, 3),
            "total_distance_mm": round(total_distance_mm, 4),
            "mean_speed_px_sec": round(mean_speed_px_sec, 3),
            "mean_speed_mm_sec": round(mean_speed_mm_sec, 4),
            "mean_speed_ratio": round(mean_speed_ratio, 4),
            "moving_ratio": round(moving_ratio, 4),
            "estimated_live_ratio": round(estimated_live_ratio, 4),
            "vitality_score": round(vitality_score, 2),
            "visibility_ratio": round(visibility_ratio, 4),
            "avg_confidence": round(track["sum_confidence"] / track["frames_seen"], 4),
            "is_live_motion": is_live_motion,
        }

    def _track_duration_seconds(self, track, fps):
        if not fps or track["frames_seen"] < 2:
            return 0.0

        frame_span = track["last_frame_idx"] - track["first_frame_idx"]
        return max(frame_span / fps, 1.0 / fps)

    def _track_vitality_score(self, mean_speed_mm_sec, moving_ratio, visibility_ratio):
        speed_score = self._speed_score(mean_speed_mm_sec)
        score = 100.0 * speed_score
        return max(0.0, min(score, 100.0))

    def _speed_score(self, mean_speed_mm_sec):
        speed_ratio = self._speed_ratio(mean_speed_mm_sec)
        if speed_ratio <= 0:
            return 0.0

        exponent, midpoint = self._speed_curve_params()
        return speed_ratio ** exponent / (speed_ratio ** exponent + midpoint ** exponent)

    def _speed_ratio(self, mean_speed_mm_sec):
        if self.reference_speed_mm_sec <= 0:
            return 0.0
        return max(0.0, mean_speed_mm_sec / self.reference_speed_mm_sec)

    def _speed_curve_params(self):
        normal_ratio = max(self.normal_speed_ratio, 0.001)
        fast_ratio = max(self.fast_speed_ratio, normal_ratio + 0.001)
        normal_score = min(max(self.normal_speed_score, 0.001), 0.999)
        fast_score = min(max(self.fast_speed_score, normal_score + 0.001), 0.999)

        normal_odds = normal_score / (1.0 - normal_score)
        fast_odds = fast_score / (1.0 - fast_score)
        exponent = math.log(fast_odds / normal_odds) / math.log(fast_ratio / normal_ratio)
        midpoint = normal_ratio / (normal_odds ** (1.0 / exponent))
        return exponent, midpoint

    def _px_to_mm(self, value_px):
        if self.px_per_mm <= 0:
            return 0.0
        return value_px / self.px_per_mm
