const fs = require('fs');
let code = fs.readFileSync('components/ScriptResult.tsx', 'utf8');

// For generateAllVisuals
code = code.replace(
  `          } catch (err) {
            console.error(err);
          }
        }
      }
      playNotification('Генерация визуальных промптов успешно завершена');
    } finally {`,
  `          } catch (err) {
            console.error(err);
            playNotification('Ошибка при генерации визуальных промптов (batch). Попробуйте еще раз.', 'error');
            return;
          }
        }
      }
      playNotification('Генерация визуальных промптов успешно завершена');
    } catch (err) {
      console.error(err);
      playNotification('Ошибка при генерации визуальных промптов.', 'error');
    } finally {`
);

// For generateAllVideoPrompts
code = code.replace(
  `          } catch (err) {
            console.error(err);
          } finally {`,
  `          } catch (err) {
            console.error(err);
            playNotification('Ошибка при генерации видео-промптов. Попробуйте еще раз.', 'error');
            return;
          } finally {`
);
code = code.replace(
  `      }
      playNotification('Генерация видео-промптов успешно завершена');
    } finally {`,
  `      }
      playNotification('Генерация видео-промптов успешно завершена');
    } catch (err) {
      console.error(err);
      playNotification('Ошибка при генерации видео-промптов.', 'error');
    } finally {`
);

// For translateAll
code = code.replace(
  `          } catch (err) {
            console.error(err);
          }
        }
      }
      playNotification('Перевод на английский успешно завершен');
    } finally {`,
  `          } catch (err) {
            console.error(err);
            playNotification('Ошибка при переводе. Попробуйте еще раз.', 'error');
            return;
          }
        }
      }
      playNotification('Перевод на английский успешно завершен');
    } catch (err) {
      console.error(err);
      playNotification('Ошибка при переводе.', 'error');
    } finally {`
);

fs.writeFileSync('components/ScriptResult.tsx', code);
console.log('Fixed error handling');
