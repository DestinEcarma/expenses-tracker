use serde::Deserialize;
use surrealdb::Datetime;

pub struct DateRange {
    pub start: Datetime,
    pub end: Datetime,
}

impl<'de> Deserialize<'de> for DateRange {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct Raw {
            start: Datetime,
            end: Datetime,
        }

        let raw = Raw::deserialize(deserializer)?;

        if raw.start >= raw.end {
            return Err(serde::de::Error::custom(
                "start_date must be before end_date",
            ));
        }

        Ok(Self {
            start: raw.start,
            end: raw.end,
        })
    }
}
