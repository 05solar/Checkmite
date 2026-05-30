MAX_TRACK_MISSES = 4
MOTION_THRESHOLD_PX = 2.0
MAX_CENTER_DISTANCE_PX = 120.0
MAX_VALID_MOVE_PX = 60.0
MIN_VALID_MOVE_PX = 8.0
BBOX_MOVE_THRESHOLD_RATIO = 1.0
MIN_IOU_FOR_MATCH = 0.05


def bbox_iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    intersection = inter_w * inter_h
    if intersection <= 0:
        return 0.0

    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union = area_a + area_b - intersection
    if union <= 0:
        return 0.0

    return intersection / union


def center_distance(center_a, center_b):
    return ((center_a[0] - center_b[0]) ** 2 + (center_a[1] - center_b[1]) ** 2) ** 0.5


def bbox_diagonal(bbox):
    x1, y1, x2, y2 = bbox
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5


class TrackingService:
    def __init__(
        self,
        max_track_misses=MAX_TRACK_MISSES,
        motion_threshold_px=MOTION_THRESHOLD_PX,
        max_center_distance_px=MAX_CENTER_DISTANCE_PX,
        max_valid_move_px=MAX_VALID_MOVE_PX,
        min_valid_move_px=MIN_VALID_MOVE_PX,
        bbox_move_threshold_ratio=BBOX_MOVE_THRESHOLD_RATIO,
        min_iou_for_match=MIN_IOU_FOR_MATCH,
    ):
        self.max_track_misses = max_track_misses
        self.motion_threshold_px = motion_threshold_px
        self.max_center_distance_px = max_center_distance_px
        self.max_valid_move_px = max_valid_move_px
        self.min_valid_move_px = min_valid_move_px
        self.bbox_move_threshold_ratio = bbox_move_threshold_ratio
        self.min_iou_for_match = min_iou_for_match
        self.tracks = {}
        self.next_track_id = 1

    def update(self, detections, frame_idx):
        matched_detections = set()
        matched_tracks = set()
        candidate_pairs = []

        for det_idx, detection in enumerate(detections):
            for track_id, track in self.tracks.items():
                if track["class_name"] != detection["class_name"]:
                    continue
                if track["misses"] > self.max_track_misses:
                    continue

                distance_px = center_distance(track["center"], detection["center"])
                iou = bbox_iou(track["bbox"], detection["bbox"])
                valid_move_threshold = self._valid_move_threshold(track, detection)
                match_threshold = min(self.max_center_distance_px, valid_move_threshold)

                if distance_px > valid_move_threshold:
                    continue

                if distance_px <= match_threshold or iou >= self.min_iou_for_match:
                    candidate_pairs.append((-iou, distance_px, track_id, det_idx))

        for _, distance_px, track_id, det_idx in sorted(candidate_pairs):
            if track_id in matched_tracks or det_idx in matched_detections:
                continue

            detection = detections[det_idx]
            track = self.tracks[track_id]
            valid_move_threshold = self._valid_move_threshold(track, detection)
            if distance_px > valid_move_threshold:
                track["outlier_moves"] += 1
                continue

            track["total_distance_px"] += distance_px
            track["moving_frames"] += int(distance_px >= self.motion_threshold_px)
            track["bbox"] = detection["bbox"]
            track["center"] = detection["center"]
            track["last_frame_idx"] = frame_idx
            track["frames_seen"] += 1
            track["misses"] = 0
            track["sum_confidence"] += detection["score"]
            track["trajectory"].append(self._trajectory_point(detection, frame_idx, distance_px))
            detection["track_id"] = track_id
            detection["distance_from_previous_px"] = distance_px
            matched_tracks.add(track_id)
            matched_detections.add(det_idx)

        for track_id, track in self.tracks.items():
            if track_id not in matched_tracks:
                track["misses"] += 1

        for det_idx, detection in enumerate(detections):
            if det_idx in matched_detections:
                continue

            track_id = self.next_track_id
            self.next_track_id += 1
            detection["track_id"] = track_id
            detection["distance_from_previous_px"] = 0.0
            self.tracks[track_id] = self._build_track(track_id, detection, frame_idx)

        return detections

    def _build_track(self, track_id, detection, frame_idx):
        return {
            "track_id": track_id,
            "class_name": detection["class_name"],
            "bbox": detection["bbox"],
            "center": detection["center"],
            "first_frame_idx": frame_idx,
            "last_frame_idx": frame_idx,
            "frames_seen": 1,
            "misses": 0,
            "total_distance_px": 0.0,
            "moving_frames": 0,
            "outlier_moves": 0,
            "sum_confidence": detection["score"],
            "trajectory": [self._trajectory_point(detection, frame_idx, 0.0)],
        }

    def _valid_move_threshold(self, track, detection):
        bbox_based_threshold = self.bbox_move_threshold_ratio * min(
            bbox_diagonal(track["bbox"]),
            bbox_diagonal(detection["bbox"]),
        )
        bbox_based_threshold = max(self.min_valid_move_px, bbox_based_threshold)
        return min(self.max_valid_move_px, bbox_based_threshold)

    def _trajectory_point(self, detection, frame_idx, distance_from_previous_px):
        return {
            "frame_idx": frame_idx,
            "center": detection["center"],
            "bbox": detection["bbox"],
            "confidence": detection["score"],
            "distance_from_previous_px": distance_from_previous_px,
        }
