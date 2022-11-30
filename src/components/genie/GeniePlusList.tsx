import { useGenieClient } from '@/contexts/GenieClient';
import { useTheme } from '@/contexts/Theme';
import { displayTime } from '@/datetime';
import { PlusExperience } from '@/hooks/useExperiences';
import DropIcon from '@/icons/DropIcon';
import LightningIcon from '@/icons/LightningIcon';
import StarIcon from '@/icons/StarIcon';
import Modal from '../Modal';
import BookExperience from './BookExperience';
import GeniePlusButton from './GeniePlusButton';
import Legend, { Symbol } from './Legend';
import { ScreenProps } from './Merlock';
import { useSelectedParty } from './PartySelector';
import RebookingHeader from './RebookingHeader';
import StandbyTime from './StandbyTime';
import TimeBanner from './TimeBanner';

const isBooked = (exp: PlusExperience) => exp.booked && !exp.starred;

export default function GeniePlusList({
  experiences,
  refresh,
  toggleStar,
  showModal,
}: ScreenProps<PlusExperience>) {
  useSelectedParty();
  const client = useGenieClient();
  const theme = useTheme();

  const exp = experiences[0];
  const startTime = exp && exp.flex.enrollmentStartTime;
  const dropTime = exp && client.nextDropTime(exp.park);

  const showLightningPickModal = () =>
    showModal(<LightningPickModal onClose={() => showModal(null)} />);
  const showDropTimeModal = () =>
    showModal(
      <DropTimeModal dropTime={dropTime} onClose={() => showModal(null)} />
    );

  const expListItem = (exp: PlusExperience) => (
    <li
      className="pb-3 first:border-0 border-t-4 border-gray-300"
      key={exp.id + (exp.starred ? '*' : '')}
    >
      <div className="flex items-center gap-x-2 mt-2">
        <StarButton experience={exp} toggleStar={toggleStar} />
        <h3 className="flex-1 mt-0 text-lg font-semibold leading-tight truncate">
          {exp.name}
        </h3>
        {exp.lp ? (
          <InfoButton
            name="Lightning Pick"
            icon={LightningIcon}
            onClick={showLightningPickModal}
          />
        ) : dropTime && exp.drop ? (
          <InfoButton
            name="Upcoming Drop"
            icon={DropIcon}
            onClick={showDropTimeModal}
          />
        ) : null}
      </div>
      {exp.flex.preexistingPlan && (
        <div className="mt-2 border-2 border-green-600 rounded p-1 text-sm uppercase font-semibold text-center text-green-600 bg-green-100">
          Lightning Lane Booked
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <StandbyTime experience={exp} />
        <GeniePlusButton
          experience={exp}
          onClick={experience =>
            showModal(
              <BookExperience
                experience={experience}
                onClose={() => {
                  showModal(null);
                  refresh(false);
                }}
              />
            )
          }
        />
      </div>
    </li>
  );

  const unbooked = experiences.filter(exp => !isBooked(exp));
  const booked = experiences
    .filter(isBooked)
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <RebookingHeader />
      <TimeBanner
        bookTime={startTime || client.nextBookTime}
        dropTime={dropTime}
      />
      <ul data-testid="unbooked">{unbooked.map(expListItem)}</ul>
      {booked.length > 0 && (
        <>
          <h2
            className={`-mx-3 px-3 py-1 text-sm uppercase text-center ${theme.bg} text-white`}
          >
            Previously Booked
          </h2>
          <ul data-testid="booked">{booked.map(expListItem)}</ul>
        </>
      )}
      <Legend>
        <Symbol
          sym={<LightningIcon className={theme.text} />}
          def="Lightning Pick"
          onInfo={showLightningPickModal}
        />
        <Symbol
          sym={<DropIcon className={theme.text} />}
          def="Upcoming Drop"
          onInfo={showDropTimeModal}
        />
      </Legend>
    </>
  );
}

function InfoButton({
  name,
  icon: Icon,
  onClick,
}: {
  name: string;
  icon: React.FunctionComponent;
  onClick: () => void;
}) {
  const theme = useTheme();
  return (
    <button
      title={`${name} (more info)`}
      className={`-mx-2 px-2 ${theme.text}`}
      onClick={onClick}
    >
      {<Icon />}
    </button>
  );
}

function StarButton({
  experience,
  toggleStar,
}: {
  experience: PlusExperience;
  toggleStar: (exp: PlusExperience) => void;
}) {
  const theme = useTheme();
  return (
    <button
      title={`${experience.starred ? 'Unfavorite' : 'Favorite'}`}
      className="-m-2 p-2"
      onClick={() => toggleStar(experience)}
    >
      <StarIcon className={experience.starred ? theme.text : 'text-gray-300'} />
    </button>
  );
}

function LightningPickModal(props: { onClose: () => void }) {
  return (
    <Modal heading="Lightning Pick" {...props}>
      <p>
        When an attraction with a long wait has a Lightning Lane return time in
        the near future, it's highlighted as a Lightning Pick. Book these quick
        before they're gone!
      </p>
    </Modal>
  );
}

function DropTimeModal({
  dropTime,
  onClose,
}: {
  dropTime?: string;
  onClose: () => void;
}) {
  return (
    <Modal heading="Upcoming Drop" onClose={onClose}>
      <p>
        This attraction may be part of the{' '}
        {dropTime ? (
          <time dateTime={dropTime} className="font-semibold">
            {displayTime(dropTime)}
          </time>
        ) : (
          'next'
        )}{' '}
        drop of additional Lightning Lane inventory, with earlier return times
        than what's currently being offered. Availability varies but is always
        limited, so be sure you're ready to book when the drop time arrives!
      </p>
    </Modal>
  );
}