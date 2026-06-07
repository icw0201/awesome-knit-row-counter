# 프로젝트 불러오기 JSON 가이드

이 폴더의 `awesome-knit-item-import-sample.json`은 앱의 `"프로젝트 불러오기"` 기능에서 사용할 수 있는 JSON 샘플입니다.

이 문서는 같은 형식의 JSON 파일을 직접 만들 때 필요한 규칙을 정리한 가이드입니다.

## 1. 루트 문서 형식

프로젝트 불러오기용 JSON은 아래 형태를 따라야 합니다.

```json
{
  "formatVersion": 1,
  "appId": "awesome-knit-row-counter",
  "importType": "item-import",
  "dataVersion": 5,
  "payload": {
    "knitItems": []
  }
}
```

### 필수 루트 필드

- `formatVersion`: 반드시 `1`
- `appId`: 반드시 `"awesome-knit-row-counter"`
- `importType`: 반드시 `"item-import"`
- `dataVersion`: 현재 앱이 사용하는 데이터 구조 버전. 현재 기준값은 `5`
- `payload.knitItems`: 프로젝트/카운터 배열

`dataVersion`은 앱이 이 파일을 어떤 규칙으로 해석하고 검증할지 결정할 때 사용하는 값입니다.
현재 앱의 기준값은 `src/storage/migration.ts`의 `CURRENT_DATA_VERSION = 5`이며, 보통 프로젝트 불러오기용 JSON도 `5`로 작성하면 됩니다.

## 2. `knitItems`에 들어갈 수 있는 타입

`knitItems` 배열에는 아래 두 타입만 넣을 수 있습니다.

- `type: "project"`
- `type: "counter"`

즉, 프로젝트 1개와 그 프로젝트에 속한 카운터 여러 개를 함께 넣거나, 독립 카운터만 단독으로 넣을 수 있습니다.

## 3. 공통 규칙

모든 아이템은 아래 규칙을 만족해야 합니다.

- `id`: 문자열, 문서 내부에서 중복되면 안 됨
- `title`: 비어 있지 않은 문자열
- 제목 최대 길이: 15자
- 문자열 앞뒤 공백은 제거된 상태여야 함

### 권장 ID 네이밍

앱은 import 시 내부적으로 새 `proj_*` / `counter_*` ID를 다시 생성합니다.  
하지만 문서 내부 참조를 읽기 쉽게 유지하려면 아래처럼 템플릿 ID를 통일하는 것을 권장합니다.

- 프로젝트: `proj_template_<slug>_000`
- 카운터: `counter_template_<slug>_<순번>`

예:

- `proj_template_kudos_bracelet_000`
- `counter_template_kudos_bracelet_alert_001`
- `counter_template_kudos_bracelet_full_002`
- `counter_template_kudos_bracelet_notice_003`

## 4. 프로젝트 아이템 형식

프로젝트 아이템은 아래 구조를 사용합니다.

```json
{
  "id": "proj_template_example_000",
  "type": "project",
  "title": "예시 프로젝트",
  "counterIds": [
    "counter_template_example_a_001",
    "counter_template_example_b_002"
  ],
  "info": {
    "startDate": "",
    "endDate": "",
    "gauge": "",
    "yarn": "",
    "needle": "",
    "notes": ""
  }
}
```

### 프로젝트 필드 설명

- `id`: 프로젝트용 고유 문자열 ID
- `type`: 반드시 `"project"`
- `title`: 프로젝트 이름
- `counterIds`: 이 프로젝트에 속한 카운터 ID 목록
- `info`: 선택 필드

### 프로젝트에서 금지되는 필드

아래 필드는 넣으면 import 검증에서 실패합니다.

- `updatedAt`

## 5. 카운터 아이템 형식

카운터 아이템은 아래 구조를 사용합니다.

```json
{
  "id": "counter_template_example_a_001",
  "type": "counter",
  "title": "예시 카운터",
  "count": 0,
  "targetCount": 10,
  "parentProjectId": "proj_template_example_000",
  "subCount": 0,
  "subRule": 0,
  "subRuleIsActive": false,
  "subModalIsOpen": false,
  "mascotIsActive": true,
  "wayIsChange": false,
  "repeatRules": [],
  "sectionModalIsOpen": false,
  "info": {
    "startDate": "",
    "endDate": "",
    "gauge": "",
    "yarn": "",
    "needle": "",
    "notes": ""
  }
}
```

### 카운터 필드 설명

- `id`: 카운터용 고유 문자열 ID
- `type`: 반드시 `"counter"`
- `title`: 카운터 이름
- `count`: 현재 카운트 값
- `targetCount`: 목표 단수
- `parentProjectId`: 프로젝트 소속이면 프로젝트 ID, 독립 카운터면 `null`
- `subCount`: 보조 카운트 값
- `subRule`: 보조 카운터 규칙 번호
- `subRuleIsActive`: 보조 규칙 활성화 여부
- `subModalIsOpen`: 보조 카운터 모달 상태
- `mascotIsActive`: 마스코트 표시 여부
- `wayIsChange`: 앞뒤 방향 사용 여부
- `repeatRules`: 반복 규칙 배열
- `sectionModalIsOpen`: 구간 기록 모달 상태
- `way`: 선택 필드, `"front"` 또는 `"back"`
- `info`: 선택 필드

### 카운터에서 금지되는 필드

아래 필드는 넣으면 import 검증에서 실패합니다.

- `elapsedTime`
- `timerIsActive`
- `timerIsPlaying`
- `sectionRecords`
- `updatedAt`

## 6. `info` 객체 규칙

`project.info`와 `counter.info`는 같은 형식을 사용합니다.

```json
{
  "startDate": "",
  "endDate": "",
  "gauge": "",
  "yarn": "",
  "needle": "",
  "notes": ""
}
```

### `info` 규칙

- 전체 `info`는 생략 가능
- `startDate`, `endDate`는 빈 문자열 또는 앱이 허용하는 날짜 문자열
- `gauge`, `yarn`, `needle`, `notes`는 각각 최대 500자
- 문자열 앞뒤 공백이 있으면 검증 실패 가능

## 7. `repeatRules` 규칙

`repeatRules`는 카운터의 반복 규칙 배열입니다.

예:

```json
[
  {
    "message": "메리야스",
    "startNumber": 1,
    "endNumber": 0,
    "repeatCount": 2,
    "endMode": "repeatCount",
    "ruleNumber": 1,
    "color": "#574559"
  }
]
```

### 반복 규칙 필드 설명

- `message`: 규칙 메시지, 최대 15자
- `startNumber`: 0 이상의 정수 또는 `null`
- `endNumber`: 0 이상의 정수
- `repeatCount`: 0 이상의 정수, `endMode`가 `"repeatCount"`이면 1 이상이어야 함
- `endMode`: `"repeatCount"`, `"endNumber"`, `null`
- `ruleNumber`: 1 이상의 정수
- `color`: 6자리 혹은 8자리 색상 코드

### 반복 규칙 조합 규칙

- `endMode === "repeatCount"`이면 `repeatCount`가 반드시 필요
- `endMode === null`이면 `startNumber`가 반드시 있어야 함
- `endMode === "endNumber"`이면 `startNumber <= endNumber`여야 함

## 8. 프로젝트-카운터 연결 규칙

이 부분이 맞지 않으면 `"프로젝트 데이터 형식이 올바르지 않습니다."` 오류가 납니다.

### 반드시 지켜야 하는 규칙

- `project.counterIds`에 적은 모든 ID는 실제 `counter` 아이템으로 존재해야 함
- 각 카운터의 `parentProjectId`는 자신을 참조하는 프로젝트 ID와 정확히 같아야 함
- `parentProjectId`가 있는 카운터는 해당 프로젝트의 `counterIds`에도 반드시 포함되어야 함
- `counterIds` 안에 같은 ID를 중복으로 넣으면 안 됨

## 9. 배열 순서와 생성일 정렬

앱은 import 시 원본 `id`를 그대로 저장하지 않고 새 ID를 다시 만듭니다.  
이때 `knitItems` 배열 순서대로 새 생성 시각/ID가 부여됩니다.

따라서 `"생성일 / 내림차순"` 정렬 결과에 영향을 주는 것은 **원본 ID 문자열 자체보다 `knitItems` 배열 순서**입니다.

예를 들어 프로젝트 내부 카운터가 import 후

- 도안 설명 필독
- 전체 도안
- 알림단만

순서로 보이게 하고 싶다면, JSON 안의 카운터 배치 순서도 그 목적에 맞게 설계해야 합니다.

## 10. 최소 예시

아래는 가장 단순한 프로젝트 + 카운터 1개 예시입니다.

```json
{
  "formatVersion": 1,
  "appId": "awesome-knit-row-counter",
  "importType": "item-import",
  "dataVersion": 5,
  "payload": {
    "knitItems": [
      {
        "id": "proj_template_example_000",
        "type": "project",
        "title": "예시 프로젝트",
        "counterIds": [
          "counter_template_example_001"
        ],
        "info": {
          "startDate": "",
          "endDate": "",
          "gauge": "",
          "yarn": "",
          "needle": "",
          "notes": ""
        }
      },
      {
        "id": "counter_template_example_001",
        "type": "counter",
        "title": "예시 카운터",
        "count": 0,
        "targetCount": 10,
        "parentProjectId": "proj_template_example_000",
        "subCount": 0,
        "subRule": 0,
        "subRuleIsActive": false,
        "subModalIsOpen": false,
        "mascotIsActive": true,
        "wayIsChange": false,
        "repeatRules": [],
        "sectionModalIsOpen": false
      }
    ]
  }
}
```

## 11. 작성 체크리스트

파일 저장 전 아래 항목을 확인하면 실패를 많이 줄일 수 있습니다.

- 루트의 `formatVersion`, `appId`, `importType`, `dataVersion`이 맞는가
- `payload` 안에 `knitItems`만 들어 있는가
- 모든 `id`가 고유한가
- 모든 `title`이 15자 이하인가
- 프로젝트의 `counterIds`와 카운터의 `parentProjectId`가 서로 정확히 연결되는가
- 금지 필드(`updatedAt`, `elapsedTime`, `sectionRecords` 등)를 넣지 않았는가
- 긴 텍스트 필드(`gauge`, `yarn`, `needle`, `notes`)가 500자 이하인가
- 문자열 앞뒤 공백이 없는가

## 12. 참고 파일

- 샘플 JSON: `awesome-knit-item-import-sample.json`
- 이 가이드: `item-import-guide.md`
